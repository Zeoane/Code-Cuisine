import { CuisineStyle, DietPreference, TimeCategory } from "../models/recipe.models";

/** Cooking time options with their English label and duration hint. */
export const TIME_OPTIONS: { value: TimeCategory; label: string; hint: string }[] = [
  { value: "quick", label: "Quick", hint: "up to 20min" },
  { value: "medium", label: "Medium", hint: "25-40min" },
  { value: "elaborate", label: "Complex", hint: "over 45min" },
];

/** Cuisine options in the order used by the Figma design. */
export const CUISINE_OPTIONS: { value: CuisineStyle; label: string }[] = [
  { value: "german", label: "German" },
  { value: "italian", label: "Italian" },
  { value: "indian", label: "Indian" },
  { value: "japanese", label: "Japanese" },
  { value: "gourmet", label: "Gourmet" },
  { value: "fusion", label: "Fusion" },
];

/** Diet options in the order used by the Figma design. */
export const DIET_OPTIONS: { value: DietPreference; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "keto", label: "Keto" },
  { value: "none", label: "No preferences" },
];

/** English label for a cuisine style, or null when nothing is selected. */
export function cuisineLabel(value: CuisineStyle | null): string | null {
  return CUISINE_OPTIONS.find(option => option.value === value)?.label ?? null;
}

/** English label for a time category, or null when nothing is selected. */
export function timeLabel(value: TimeCategory | null): string | null {
  return TIME_OPTIONS.find(option => option.value === value)?.label ?? null;
}

/** English label for a diet preference, or null when nothing is selected. */
export function dietLabel(value: DietPreference | null): string | null {
  return DIET_OPTIONS.find(option => option.value === value)?.label ?? null;
}
