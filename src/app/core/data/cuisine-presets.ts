import { CuisineStyle, DietPreference } from "../models/recipe.models";

/** Style-specific building blocks used by the mock recipe generator. */
export interface CuisinePreset {
  /** Dish name templates; "%s" is replaced with the leading ingredient. */
  nameTemplates: string[];
  /** Typical spices/flavourings mentioned in descriptions and steps. */
  spices: string[];
  /** Pantry staples that may be suggested as missing ingredients. */
  staples: string[];
}

/** Dish templates, spices and staples for every selectable cuisine style. */
export const CUISINE_PRESETS: Record<CuisineStyle, CuisinePreset> = {
  german: {
    nameTemplates: ["%s Pan, Home-Style", "Hearty %s Stew", "%s Bake"],
    spices: ["Marjoram", "Caraway", "Mustard", "Parsley"],
    staples: ["Butter", "Flour", "Cream", "Bacon"],
  },
  italian: {
    nameTemplates: ["Pasta al %s", "%s Risotto", "Oven-Baked %s alla Italiana"],
    spices: ["Basil", "Oregano", "Garlic", "Chili flakes"],
    staples: ["Olive oil", "Parmesan", "Pasta", "Tomato passata"],
  },
  japanese: {
    nameTemplates: ["%s Teriyaki Pan", "%s Donburi", "Miso Soup with %s"],
    spices: ["Soy sauce", "Ginger", "Sesame", "Mirin"],
    staples: ["Rice", "Soy sauce", "Sesame oil", "Nori"],
  },
  indian: {
    nameTemplates: ["%s Curry", "%s Masala Pan", "Spicy %s Dal"],
    spices: ["Turmeric", "Garam masala", "Cumin", "Coriander"],
    staples: ["Basmati rice", "Coconut milk", "Lentils", "Ghee"],
  },
  gourmet: {
    nameTemplates: ["%s Finely Poached with Beurre Blanc", "Confit %s Composition", "%s Fine-Dining Plate"],
    spices: ["Thyme", "Sea salt", "Butter", "White wine"],
    staples: ["Butter", "Cream", "White wine", "Shallots"],
  },
  fusion: {
    nameTemplates: ["%s Fusion Bowl", "Street Food Wrap with %s", "Pan-Seared %s Fusion-Style"],
    spices: ["Soy sauce", "Lime", "Chili", "Coriander"],
    staples: ["Soy sauce", "Lime", "Sesame oil", "Spring onions"],
  },
};

/** Staples considered unsuitable for a given diet preference. */
const DIET_EXCLUDED_STAPLES: Record<DietPreference, string[]> = {
  vegan: ["Butter", "Cream", "Bacon", "Parmesan", "Ghee"],
  vegetarian: ["Bacon"],
  keto: ["Rice", "Basmati rice", "Pasta", "Flour"],
  none: [],
};

/** Filters a cuisine's staples down to ones compatible with the given diet. */
export function dietSafeStaples(cuisine: CuisineStyle, diet: DietPreference): string[] {
  const excluded = DIET_EXCLUDED_STAPLES[diet];
  return CUISINE_PRESETS[cuisine].staples.filter(s => !excluded.includes(s));
}
