import { CuisineStyle, DietPreference, Difficulty, TimeCategory } from "../models/recipe.models";

/** German display labels for each cuisine style. */
export const CUISINE_LABELS: Record<CuisineStyle, string> = {
  german: "Deutsch",
  italian: "Italienisch",
  japanese: "Japanisch",
  indian: "Indisch",
  gourmet: "Gourmet",
  fusion: "Fusion",
};

/** German display labels for each diet preference. */
export const DIET_LABELS: Record<DietPreference, string> = {
  vegetarian: "Vegetarisch",
  vegan: "Vegan",
  keto: "Keto",
  none: "Keine Einschränkung",
};

/** German display labels for each time budget category. */
export const TIME_CATEGORY_LABELS: Record<TimeCategory, string> = {
  quick: "Schnell (bis 20 Min)",
  medium: "Mittel (20-45 Min)",
  elaborate: "Aufwendig (45+ Min)",
};

/** German display labels for each difficulty level. */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Einfach",
  medium: "Mittel",
  hard: "Anspruchsvoll",
};
