import { NutritionInfo } from "../models/recipe.models";

/** The three macronutrients, in the order the Figma design lists them. */
export type MacroKey = "protein" | "fat" | "carbs";

/** Energy per gram, the Atwater factors used on nutrition labels. */
const KCAL_PER_GRAM: Record<MacroKey, number> = { protein: 4, fat: 9, carbs: 4 };

/** One macro's grams and its share of the recipe's energy. */
export interface MacroShare {
  key: MacroKey;
  label: string;
  grams: number;
  percent: number;
}

/** Scales the per-serving values up to the whole recipe. */
export function totalNutrition(nutrition: NutritionInfo, servings: number): NutritionInfo {
  const factor = Math.max(1, Math.round(servings));
  return {
    caloriesPerServing: nutrition.caloriesPerServing * factor,
    proteinGrams: nutrition.proteinGrams * factor,
    carbsGrams: nutrition.carbsGrams * factor,
    fatGrams: nutrition.fatGrams * factor,
  };
}

/**
 * Splits the macros by the share of energy each contributes. Percentages are
 * rounded by largest remainder so they always add up to exactly 100.
 */
export function macroShares(nutrition: NutritionInfo): MacroShare[] {
  const rows: { key: MacroKey; label: string; grams: number }[] = [
    { key: "protein", label: "Protein", grams: nutrition.proteinGrams },
    { key: "fat", label: "Fat", grams: nutrition.fatGrams },
    { key: "carbs", label: "Carbs", grams: nutrition.carbsGrams },
  ];

  const energy = rows.map(row => Math.max(0, row.grams) * KCAL_PER_GRAM[row.key]);
  const total = energy.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return rows.map(row => ({ ...row, percent: 0 }));

  const exact = energy.map(value => (value / total) * 100);
  const percent = exact.map(Math.floor);
  let remaining = 100 - percent.reduce((sum, value) => sum + value, 0);

  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);
  for (const entry of byRemainder) {
    if (remaining <= 0) break;
    percent[entry.index] += 1;
    remaining -= 1;
  }

  return rows.map((row, index) => ({ ...row, percent: percent[index] }));
}
