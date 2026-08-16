import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { environment } from "../../../environments/environment";
import { GenerationOptions } from "../models/recipe.models";
import { RecipeGeneratorService } from "./recipe-generator.service";

/** Builds a minimal, valid set of generation options for tests. */
function buildOptions(overrides: Partial<GenerationOptions> = {}): GenerationOptions {
  return {
    ingredients: ["Rice", "Chicken", "Bell pepper"],
    servings: 2,
    timeCategory: "medium",
    cuisineStyle: "fusion",
    diet: "none",
    helpers: 1,
    ...overrides,
  };
}

describe("RecipeGeneratorService", () => {
  let service: RecipeGeneratorService;
  let originalGenerateUrl: string;

  beforeEach(() => {
    // These tests exercise the local mock generator, not a live n8n call -
    // force the "not configured" path regardless of the real deployed
    // environment.ts (which may have a real webhook URL set).
    originalGenerateUrl = environment.n8n.generateUrl;
    environment.n8n.generateUrl = "";
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(RecipeGeneratorService);
  });

  afterEach(() => {
    environment.n8n.generateUrl = originalGenerateUrl;
  });

  it("generates exactly three recipes", async () => {
    const recipes = await service.generate(buildOptions());
    expect(recipes.length).toBe(3);
  });

  it("suggests at most three missing base ingredients per recipe", async () => {
    const recipes = await service.generate(buildOptions());
    recipes.forEach(recipe => expect(recipe.missingIngredients.length).toBeLessThanOrEqual(3));
  });

  it("scales the ingredient list to one entry per user ingredient", async () => {
    const options = buildOptions({ ingredients: ["Tomatoes", "Rice"] });
    const [recipe] = await service.generate(options);
    expect(recipe.ingredients.length).toBe(2);
  });

  it("assigns every step to a helper within 1..helpers", async () => {
    const options = buildOptions({ helpers: 3 });
    const [recipe] = await service.generate(options);
    recipe.steps.forEach(step => {
      expect(step.assignedTo).toBeGreaterThanOrEqual(1);
      expect(step.assignedTo).toBeLessThanOrEqual(3);
    });
  });

  it("never marks steps as parallel for a single helper", async () => {
    const options = buildOptions({ helpers: 1 });
    const [recipe] = await service.generate(options);
    expect(recipe.steps.some(step => step.isParallel)).toBeFalse();
  });

  it("lowers carbs for the keto diet", async () => {
    const [ketoRecipe] = await service.generate(buildOptions({ diet: "keto" }));
    const [normalRecipe] = await service.generate(buildOptions({ diet: "none" }));
    expect(ketoRecipe.nutrition!.carbsGrams).toBeLessThan(normalRecipe.nutrition!.carbsGrams);
  });

  it("keeps servings and cuisine style from the input options", async () => {
    const recipes = await service.generate(buildOptions({ servings: 4, cuisineStyle: "japanese" }));
    recipes.forEach(recipe => {
      expect(recipe.servings).toBe(4);
      expect(recipe.cuisineStyle).toBe("japanese");
    });
  });
});
