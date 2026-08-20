import { GeneratedRecipe, StoredRecipe } from "../models/recipe.models";
import { paginateLibrary } from "./library.service";

/** Builds a minimal, valid stored recipe for tests. */
function buildRecipe(overrides: Partial<StoredRecipe> = {}): StoredRecipe {
  const base: GeneratedRecipe = {
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
  };
  return { ...base, id: 1, helpers: 1, createdAt: new Date().toISOString(), ...overrides };
}

// LibraryService itself talks to Firestore (see library.service.ts), so its
// pagination/filtering logic is exercised here as the pure `paginateLibrary`
// helper instead of through the service - no live Firestore connection needed.
describe("paginateLibrary", () => {
  it("paginates 20 recipes per page", () => {
    const recipes = Array.from({ length: 25 }, (_, i) => buildRecipe({ id: i + 1, title: `Recipe ${i}` }));
    expect(paginateLibrary(recipes, 1).recipes.length).toBe(20);
    expect(paginateLibrary(recipes, 2).recipes.length).toBe(5);
    expect(paginateLibrary(recipes, 1).total).toBe(25);
  });

  it("filters the library by cuisine style", () => {
    const recipes = [
      buildRecipe({ id: 1, cuisineStyle: "german" }),
      buildRecipe({ id: 2, cuisineStyle: "italian" }),
    ];
    const filtered = paginateLibrary(recipes, 1, "german");
    expect(filtered.recipes.length).toBe(1);
    expect(filtered.recipes[0].cuisineStyle).toBe("german");
  });

  it("returns an empty page for an empty library", () => {
    const page = paginateLibrary([], 1);
    expect(page.recipes).toEqual([]);
    expect(page.total).toBe(0);
  });
});
