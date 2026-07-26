import { Injectable } from "@angular/core";
import { CUISINE_PRESETS, dietSafeStaples } from "../data/cuisine-presets";
import {
  Difficulty,
  GeneratedRecipe,
  GenerationOptions,
  NutritionInfo,
  RecipeStep,
  TimeCategory,
} from "../models/recipe.models";

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
 * Client-side mock recipe generator. Stands in for the real LLM call, which
 * will move behind an n8n workflow (with Firebase storage) once those are
 * wired in by the project owner; this keeps the app fully usable locally
 * until then.
 */
@Injectable({ providedIn: "root" })
export class RecipeGeneratorService {
  /** Generates exactly three recipe suggestions for the given options. */
  generate(options: GenerationOptions): GeneratedRecipe[] {
    return [0, 1, 2].map(index => this.buildRecipe(options, index));
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
    const lead = capitalize(options.ingredients[0] ?? "Gemüse");
    return template.replace("%s", lead);
  }

  /** Builds a short appetizing description mentioning a style-typical spice. */
  private buildDescription(options: GenerationOptions, title: string): string {
    const spice = pickRandom(CUISINE_PRESETS[options.cuisineStyle].spices);
    return `${title} mit ${spice} verfeinert – schnell zubereitet aus deinen Zutaten.`;
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
    const main = options.ingredients.slice(0, 3).join(", ") || "die Zutaten";
    return [
      `${main} waschen und vorbereiten.`,
      missing.length ? `${missing.join(", ")} bereitstellen.` : "Alle Zutaten abwiegen.",
      `Pfanne oder Topf erhitzen und mit ${spice} würzen.`,
      "Zutaten nacheinander hinzufügen und unter Rühren garen.",
      `Für ${options.servings} Portionen abschmecken und anrichten.`,
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
