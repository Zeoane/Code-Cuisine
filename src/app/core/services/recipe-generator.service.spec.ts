import { GenerationOptions } from "../models/recipe.models";
import { RecipeGeneratorService } from "./recipe-generator.service";

/** Builds a minimal, valid set of generation options for tests. */
function buildOptions(overrides: Partial<GenerationOptions> = {}): GenerationOptions {
  return {
    ingredients: ["Reis", "Hähnchen", "Paprika"],
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

  beforeEach(() => {
    service = new RecipeGeneratorService();
  });

  it("generates exactly three recipes", () => {
    const recipes = service.generate(buildOptions());
    expect(recipes.length).toBe(3);
  });

  it("suggests at most three missing base ingredients per recipe", () => {
    const recipes = service.generate(buildOptions());
    recipes.forEach(recipe => expect(recipe.missingIngredients.length).toBeLessThanOrEqual(3));
  });

  it("scales the ingredient list to one entry per user ingredient", () => {
    const options = buildOptions({ ingredients: ["Tomaten", "Reis"] });
    const [recipe] = service.generate(options);
    expect(recipe.ingredients.length).toBe(2);
  });

  it("assigns every step to a helper within 1..helpers", () => {
    const options = buildOptions({ helpers: 3 });
    const [recipe] = service.generate(options);
    recipe.steps.forEach(step => {
      expect(step.assignedTo).toBeGreaterThanOrEqual(1);
      expect(step.assignedTo).toBeLessThanOrEqual(3);
    });
  });

  it("never marks steps as parallel for a single helper", () => {
    const options = buildOptions({ helpers: 1 });
    const [recipe] = service.generate(options);
    expect(recipe.steps.some(step => step.isParallel)).toBeFalse();
  });

  it("lowers carbs for the keto diet", () => {
    const [ketoRecipe] = service.generate(buildOptions({ diet: "keto" }));
    const [normalRecipe] = service.generate(buildOptions({ diet: "none" }));
    expect(ketoRecipe.nutrition!.carbsGrams).toBeLessThan(normalRecipe.nutrition!.carbsGrams);
  });

  it("keeps servings and cuisine style from the input options", () => {
    const recipes = service.generate(buildOptions({ servings: 4, cuisineStyle: "japanese" }));
    recipes.forEach(recipe => {
      expect(recipe.servings).toBe(4);
      expect(recipe.cuisineStyle).toBe("japanese");
    });
  });
});
