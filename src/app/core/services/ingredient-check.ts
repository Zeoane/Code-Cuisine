import { IngredientEntry } from "../models/recipe.models";

/** Fewest distinct ingredients a recipe request needs. */
export const MIN_INGREDIENTS = 3;

/** Rough amount of food (g/ml) a single serving needs across all ingredients. */
export const MIN_AMOUNT_PER_SERVING = 150;

/** Weight in grams assumed for one "piece" of an ingredient. */
export const PIECE_WEIGHT_GRAMS = 100;

/** Converts one entry to a comparable gram/millilitre amount. */
function amountOf(entry: IngredientEntry): number {
  return entry.unit === "piece" ? entry.quantity * PIECE_WEIGHT_GRAMS : entry.quantity;
}

/** Total comparable amount (g/ml) of all entered ingredients. */
export function totalAmount(entries: IngredientEntry[]): number {
  return entries.reduce((sum, entry) => sum + amountOf(entry), 0);
}

/**
 * Checks whether the entered ingredients can carry the requested number of
 * servings: enough distinct ingredients and enough total quantity.
 */
export function hasEnoughIngredients(entries: IngredientEntry[], servings: number): boolean {
  if (entries.length < MIN_INGREDIENTS) return false;
  return totalAmount(entries) >= servings * MIN_AMOUNT_PER_SERVING;
}
