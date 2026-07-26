import { GeneratedRecipe } from "../models/recipe.models";
import { CookbookService } from "./cookbook.service";

/** Builds a minimal, valid generated recipe for tests. */
function buildRecipe(overrides: Partial<GeneratedRecipe> = {}): GeneratedRecipe {
  return {
    title: "Testrezept",
    description: null,
    ingredients: ["100 g Reis"],
    missingIngredients: [],
    steps: [{ instruction: "Kochen.", assignedTo: 1, isParallel: false }],
    difficulty: "easy",
    cookingTimeMinutes: 20,
    servings: 2,
    cuisineStyle: "fusion",
    nutrition: null,
    ...overrides,
  };
}

describe("CookbookService", () => {
  let service: CookbookService;

  beforeEach(() => {
    localStorage.clear();
    service = new CookbookService();
  });

  it("starts out empty", () => {
    expect(service.list()).toEqual([]);
  });

  it("saves a recipe and lists it afterwards", () => {
    service.save(buildRecipe(), 2);
    const saved = service.list();
    expect(saved.length).toBe(1);
    expect(saved[0].helpers).toBe(2);
  });

  it("removes a recipe by id", () => {
    const stored = service.save(buildRecipe(), 1);
    service.remove(stored.id);
    expect(service.list()).toEqual([]);
  });

  it("reports whether a title is already saved", () => {
    service.save(buildRecipe({ title: "Curry" }), 1);
    expect(service.isSaved("Curry")).toBeTrue();
    expect(service.isSaved("Unbekannt")).toBeFalse();
  });
});
