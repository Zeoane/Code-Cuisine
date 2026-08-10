import { CuisineStyle } from "../models/recipe.models";

/** One tile of the cookbook's "Cuisine categories" grid. */
export interface CuisineCategory {
  value: CuisineStyle;
  label: string;
  /** Emoji shown next to the label (Figma exports these as blank squares). */
  emoji: string;
  image: string;
}

/** Cuisine tiles in the order used by the Figma design. */
export const CUISINE_CATEGORIES: CuisineCategory[] = [
  { value: "italian", label: "Italian cuisine", emoji: "🍝", image: "italian.webp" },
  { value: "german", label: "German cuisine", emoji: "🥨", image: "german.webp" },
  { value: "japanese", label: "Japanese cuisine", emoji: "🥢", image: "japan.webp" },
  { value: "gourmet", label: "Gourmet cuisine", emoji: "✨", image: "gourmet.webp" },
  { value: "indian", label: "Indian cuisine", emoji: "🍛", image: "indian.webp" },
  { value: "fusion", label: "Fusion cuisine", emoji: "🍢", image: "fusion.webp" },
];
