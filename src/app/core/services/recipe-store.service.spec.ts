import { StoredRecipe } from "../models/recipe.models";
import { filterByCuisine, sortByLikes } from "./recipe-store.service";

function recipe(id: number, likes: number, cuisine: StoredRecipe["cuisineStyle"]): StoredRecipe {
  return {
    id,
    likes,
    cuisineStyle: cuisine,
    title: `Recipe ${id}`,
    description: null,
    ingredients: [],
    missingIngredients: [],
    steps: [],
    difficulty: "easy",
    cookingTimeMinutes: 30,
    servings: 2,
    nutrition: null,
    helpers: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

// RecipeStoreService itself talks to Firestore, so the two decisions that are
// worth a test - which recipes a cuisine page shows and which ones lead the
// "Most liked" row - live in the pure helpers exercised here.
describe("filterByCuisine", () => {
  it("keeps only the recipes of the requested cuisine", () => {
    const all = [recipe(1, 0, "italian"), recipe(2, 0, "german"), recipe(3, 0, "italian")];
    expect(filterByCuisine(all, "italian").map(r => r.id)).toEqual([1, 3]);
  });

  it("returns an empty list when no recipe matches", () => {
    expect(filterByCuisine([recipe(1, 0, "italian")], "fusion")).toEqual([]);
  });
});

describe("sortByLikes", () => {
  it("puts the most liked recipe first", () => {
    const all = [recipe(1, 3, "german"), recipe(2, 9, "german"), recipe(3, 5, "german")];
    expect(sortByLikes(all, 10).map(r => r.id)).toEqual([2, 3, 1]);
  });

  it("breaks a tie with the newer recipe", () => {
    const all = [recipe(1, 4, "german"), recipe(7, 4, "german")];
    expect(sortByLikes(all, 10).map(r => r.id)).toEqual([7, 1]);
  });

  it("never returns more than the limit", () => {
    const all = [recipe(1, 1, "german"), recipe(2, 2, "german"), recipe(3, 3, "german")];
    expect(sortByLikes(all, 2).length).toBe(2);
  });

  it("leaves the source list untouched", () => {
    const all = [recipe(1, 1, "german"), recipe(2, 9, "german")];
    sortByLikes(all, 10);
    expect(all.map(r => r.id)).toEqual([1, 2]);
  });
});
