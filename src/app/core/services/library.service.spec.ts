import { GeneratedRecipe } from "../models/recipe.models";
import { LibraryService } from "./library.service";

/** Builds a minimal, valid generated recipe for tests. */
function buildRecipe(overrides: Partial<GeneratedRecipe> = {}): GeneratedRecipe {
  return {
    title: "Test recipe",
    description: null,
    ingredients: ["100 g rice"],
    missingIngredients: [],
    steps: [{ instruction: "Cook.", assignedTo: 1, isParallel: false }],
    difficulty: "easy",
    cookingTimeMinutes: 20,
    servings: 2,
    cuisineStyle: "fusion",
    nutrition: null,
    ...overrides,
  };
}

describe("LibraryService", () => {
  let service: LibraryService;

  beforeEach(() => {
    localStorage.clear();
    service = new LibraryService();
  });

  it("assigns sequential ids to newly added recipes", () => {
    const stored = service.addGenerated([buildRecipe(), buildRecipe()], 1);
    expect(stored.map(r => r.id)).toEqual([1, 2]);
  });

  it("paginates 20 recipes per page", () => {
    const recipes = Array.from({ length: 25 }, (_, i) => buildRecipe({ title: `Recipe ${i}` }));
    service.addGenerated(recipes, 1);
    expect(service.list(1).recipes.length).toBe(20);
    expect(service.list(2).recipes.length).toBe(5);
    expect(service.list(1).total).toBe(25);
  });

  it("filters the library by cuisine style", () => {
    service.addGenerated([buildRecipe({ cuisineStyle: "german" }), buildRecipe({ cuisineStyle: "italian" })], 1);
    const filtered = service.list(1, "german");
    expect(filtered.recipes.length).toBe(1);
    expect(filtered.recipes[0].cuisineStyle).toBe("german");
  });

  it("finds a recipe by id", () => {
    const [stored] = service.addGenerated([buildRecipe()], 1);
    expect(service.getById(stored.id)?.title).toBe("Test recipe");
  });

  it("returns undefined for an unknown id", () => {
    expect(service.getById(9999)).toBeUndefined();
  });
});
