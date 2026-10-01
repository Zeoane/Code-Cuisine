import { IngredientUnit } from "../models/recipe.models";

/**
 * Upper bound per unit for a single ingredient.
 *
 * The numbers describe what one household can plausibly cook with, not what the
 * input field can hold: 2 kg or 2 litres of one ingredient already feeds a large
 * table, and twenty pieces is a crate of potatoes. Without a cap a typo ("10000
 * potatoes") travels all the way into the prompt and produces a nonsense recipe,
 * so the limit is enforced in the form, in the row editor and again in the n8n
 * workflow - the frontend alone can be bypassed.
 */
export const MAX_QUANTITY: Record<IngredientUnit, number> = {
  gram: 2000,
  ml: 2000,
  piece: 20,
};

/** Smallest quantity that still describes an ingredient. */
export const MIN_QUANTITY = 1;

/** Short unit label used in hints and error messages. */
const UNIT_LABEL: Record<IngredientUnit, string> = {
  gram: "g",
  ml: "ml",
  piece: "pieces",
};

/**
 * True when the value is a whole-number quantity inside the unit's range.
 * @param value raw input, may be null or NaN while the field is being typed in
 */
export function isQuantityValid(value: number | null, unit: IngredientUnit): boolean {
  if (value === null || !Number.isFinite(value)) return false;
  return value >= MIN_QUANTITY && value <= MAX_QUANTITY[unit];
}

/** Pulls a value back into the unit's range, used when the unit changes. */
export function clampQuantity(value: number, unit: IngredientUnit): number {
  if (!Number.isFinite(value)) return MIN_QUANTITY;
  return Math.min(Math.max(Math.round(value), MIN_QUANTITY), MAX_QUANTITY[unit]);
}

/** Message shown next to the field, e.g. "1-2000 g". */
export function quantityHint(unit: IngredientUnit): string {
  return `${MIN_QUANTITY}-${MAX_QUANTITY[unit]} ${UNIT_LABEL[unit]}`;
}
