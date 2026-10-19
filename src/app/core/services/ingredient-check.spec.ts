import { IngredientEntry, IngredientUnit } from "../models/recipe.models";
import {
  MIN_AMOUNT_PER_SERVING,
  PIECE_WEIGHT_GRAMS,
  hasEnoughIngredients,
  totalAmount,
} from "./ingredient-check";

let nextId = 1;

function entry(quantity: number, unit: IngredientUnit = "gram"): IngredientEntry {
  return { id: nextId++, name: `Ingredient ${nextId}`, quantity, unit };
}

// This is the rule behind the "Ups! Not quite enough..." popup on the
// generator, so it is worth pinning down: it decides whether a run starts at
// all, and it has to agree with what the loading step checks a second time.
describe("totalAmount", () => {
  it("adds grams and millilitres as they are", () => {
    expect(totalAmount([entry(200, "gram"), entry(300, "ml")])).toBe(500);
  });

  it("counts a piece as its assumed weight", () => {
    expect(totalAmount([entry(2, "piece")])).toBe(2 * PIECE_WEIGHT_GRAMS);
  });

  it("is zero for an empty list", () => {
    expect(totalAmount([])).toBe(0);
  });
});

describe("hasEnoughIngredients", () => {
  it("rejects an empty list whatever the servings", () => {
    expect(hasEnoughIngredients([], 1)).toBe(false);
  });

  it("accepts exactly the required amount", () => {
    expect(hasEnoughIngredients([entry(MIN_AMOUNT_PER_SERVING * 2)], 2)).toBe(true);
  });

  it("rejects one gram short of it", () => {
    expect(hasEnoughIngredients([entry(MIN_AMOUNT_PER_SERVING * 2 - 1)], 2)).toBe(false);
  });

  it("turns a passing run into a failing one when the servings go up", () => {
    const entries = [entry(MIN_AMOUNT_PER_SERVING * 2)];
    expect(hasEnoughIngredients(entries, 2)).toBe(true);
    expect(hasEnoughIngredients(entries, 6)).toBe(false);
  });
});
