import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";
import { CUISINE_PRESETS, dietSafeStaples } from "../data/cuisine-presets";
import {
  Difficulty,
  GeneratedRecipe,
  GenerationOptions,
  NutritionInfo,
  RecipeStep,
  TimeCategory,
} from "../models/recipe.models";
import { QuotaService, QuotaStatus } from "./quota.service";

/** True once a real n8n generate-recipe webhook URL has been configured. */
export function isN8nGenerationConfigured(): boolean {
  return Boolean(environment.n8n.generateUrl);
}

/** Error codes the n8n webhook can report, mirrored on the thrown Error. */
export type GenerationErrorCode = "quota_exceeded" | "invalid_request" | "generation_failed";

/** Error thrown by `generate()` when the n8n call fails; carries a `code` for the UI to branch on. */
export class GenerationError extends Error {
  constructor(
    message: string,
    readonly code: GenerationErrorCode,
  ) {
    super(message);
  }
}

/** Shape of a successful /generate-recipe response. */
interface GenerateResponse {
  recipes: GeneratedRecipe[];
  quota: QuotaStatus;
}

/** Shape of a 4xx/5xx /generate-recipe error response. */
interface GenerateErrorResponse {
  error: GenerationErrorCode;
  message: string;
  quota?: QuotaStatus;
}

const FALLBACK_ERROR_MESSAGE = "Something went wrong while generating recipes. Please try again.";

/** Cooking time range (minutes) per time-budget category. */
const TIME_RANGES: Record<TimeCategory, [number, number]> = {
  quick: [15, 20],
  medium: [25, 45],
  elaborate: [50, 75],
};

/** Difficulty spread across the 3 generated recipes per time category. */
const DIFFICULTY_SEQUENCE: Record<TimeCategory, Difficulty[]> = {
  quick: ["easy", "easy", "medium"],
  medium: ["easy", "medium", "medium"],
  elaborate: ["medium", "hard", "hard"],
};

/**
 * Recipe generator: calls the n8n webhook (IP-quota gate + generation) once
 * `environment.n8n.generateUrl` is configured, otherwise falls back to the
 * client-side mock below so the app keeps working without any external
 * services set up — the same defensive pattern as AuthService/Firebase.
 */
@Injectable({ providedIn: "root" })
export class RecipeGeneratorService {
  private readonly http = inject(HttpClient);
  private readonly quota = inject(QuotaService);

  /** Generates exactly three recipe suggestions for the given options. */
  async generate(options: GenerationOptions): Promise<GeneratedRecipe[]> {
    if (!isN8nGenerationConfigured()) {
      return [0, 1, 2].map(index => this.buildRecipe(options, index));
    }
    return this.generateViaN8n(options);
  }

  /** Calls the n8n generate-recipe webhook, mapping errors to GenerationError. */
  private async generateViaN8n(options: GenerationOptions): Promise<GeneratedRecipe[]> {
    try {
      const response = await firstValueFrom(
        this.http.post<GenerateResponse | GenerateErrorResponse>(environment.n8n.generateUrl, options),
      );
      // n8n's error-response nodes don't reliably set their configured HTTP
      // status code, so a "successful" call can still carry an error-shaped
      // body - check the actual shape rather than trusting the HTTP status.
      if (!Array.isArray((response as GenerateResponse).recipes)) {
        const errorBody = response as GenerateErrorResponse;
        if (errorBody.quota) this.quota.applyFromResponse(errorBody.quota);
        throw new GenerationError(
          errorBody.message ?? FALLBACK_ERROR_MESSAGE,
          errorBody.error ?? "generation_failed",
        );
      }
      const successBody = response as GenerateResponse;
      this.quota.applyFromResponse(successBody.quota);
      return successBody.recipes;
    } catch (error) {
      if (error instanceof GenerationError) throw error;
      throw this.toGenerationError(error);
    }
  }

  /** Maps an HTTP failure to a typed GenerationError, syncing quota if available. */
  private toGenerationError(error: unknown): GenerationError {
    if (!(error instanceof HttpErrorResponse)) {
      return new GenerationError(FALLBACK_ERROR_MESSAGE, "generation_failed");
    }
    const body = error.error as GenerateErrorResponse | null;
    if (body?.quota) this.quota.applyFromResponse(body.quota);
    const code: GenerationErrorCode = body?.error ?? "generation_failed";
    return new GenerationError(body?.message ?? FALLBACK_ERROR_MESSAGE, code);
  }

  /** Builds a single recipe suggestion for the given result index (0-2). */
  private buildRecipe(options: GenerationOptions, index: number): GeneratedRecipe {
    const title = this.buildTitle(options, index);
    const missingIngredients = this.buildMissingIngredients(options);
    return {
      title,
      description: this.buildDescription(options, title),
      ingredients: this.scaleIngredients(options),
      missingIngredients,
      steps: this.buildSteps(options, missingIngredients),
      difficulty: DIFFICULTY_SEQUENCE[options.timeCategory][index],
      cookingTimeMinutes: this.pickCookingTime(options.timeCategory, index),
      servings: options.servings,
      cuisineStyle: options.cuisineStyle,
      nutrition: this.buildNutrition(options),
    };
  }

  /** Builds a dish title from the cuisine's name template and lead ingredient. */
  private buildTitle(options: GenerationOptions, index: number): string {
    const templates = CUISINE_PRESETS[options.cuisineStyle].nameTemplates;
    const template = templates[index % templates.length];
    const lead = capitalize(options.ingredients[0] ?? "Vegetables");
    return template.replace("%s", lead);
  }

  /** Builds a short appetizing description mentioning a style-typical spice. */
  private buildDescription(options: GenerationOptions, title: string): string {
    const spice = pickRandom(CUISINE_PRESETS[options.cuisineStyle].spices);
    return `${title}, finished with ${spice} – quickly prepared from your ingredients.`;
  }

  /** Scales quantity hints for each ingredient to the requested servings. */
  private scaleIngredients(options: GenerationOptions): string[] {
    const grams = gramsFor(options.servings);
    return options.ingredients.map(item => `${grams} g ${item}`);
  }

  /** Picks up to 3 missing base ingredients not already in the user's list. */
  private buildMissingIngredients(options: GenerationOptions): string[] {
    const have = options.ingredients.map(i => i.toLowerCase());
    const candidates = dietSafeStaples(options.cuisineStyle, options.diet);
    return candidates.filter(s => !have.includes(s.toLowerCase())).slice(0, 3);
  }

  /** Builds chronological steps, marking parallel ones and helper assignment. */
  private buildSteps(options: GenerationOptions, missing: string[]): RecipeStep[] {
    const texts = this.stepTexts(options, missing);
    return texts.map((instruction, i) => ({
      instruction,
      assignedTo: (i % options.helpers) + 1,
      isParallel: options.helpers > 1 && i > 0 && i % 2 === 1,
    }));
  }

  /** Builds the human-readable instruction texts in cooking order. */
  private stepTexts(options: GenerationOptions, missing: string[]): string[] {
    const spice = pickRandom(CUISINE_PRESETS[options.cuisineStyle].spices);
    const main = options.ingredients.slice(0, 3).join(", ") || "the ingredients";
    return [
      `Wash and prepare ${main}.`,
      missing.length ? `Get ${missing.join(", ")} ready.` : "Weigh out all ingredients.",
      `Heat a pan or pot and season with ${spice}.`,
      "Add the ingredients one by one and cook while stirring.",
      `Season to taste and plate for ${options.servings} servings.`,
    ];
  }

  /** Picks a cooking time within the category's range, varied per result index. */
  private pickCookingTime(category: TimeCategory, index: number): number {
    const [min, max] = TIME_RANGES[category];
    const step = Math.round(((max - min) / 2) * index);
    return min + step;
  }

  /** Builds plausible per-serving nutrition facts influenced by the diet. */
  private buildNutrition(options: GenerationOptions): NutritionInfo {
    const base = { caloriesPerServing: 520, proteinGrams: 28, carbsGrams: 55, fatGrams: 18 };
    if (options.diet === "keto") return { ...base, carbsGrams: 12, fatGrams: 38 };
    if (options.diet === "vegan") return { ...base, proteinGrams: 18, fatGrams: 14 };
    return base;
  }
}

/** Capitalizes the first letter of a word. */
function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Picks a random item from a list to keep repeated suggestions varied. */
function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Rough grams-per-portion hint used to scale ingredient quantities. */
function gramsFor(servings: number): number {
  return 80 + servings * 40;
}
