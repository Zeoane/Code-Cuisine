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
    nameTemplates: ["%s-Pfanne nach Hausmacher-Art", "Deftiger %s-Eintopf", "%s-Auflauf"],
    spices: ["Majoran", "Kümmel", "Senf", "Petersilie"],
    staples: ["Butter", "Mehl", "Sahne", "Speck"],
  },
  italian: {
    nameTemplates: ["Pasta al %s", "%s-Risotto", "Ofen-%s alla Italiana"],
    spices: ["Basilikum", "Oregano", "Knoblauch", "Chiliflocken"],
    staples: ["Olivenöl", "Parmesan", "Pasta", "Passierte Tomaten"],
  },
  japanese: {
    nameTemplates: ["%s-Teriyaki-Pfanne", "%s-Donburi", "Miso-Suppe mit %s"],
    spices: ["Sojasauce", "Ingwer", "Sesam", "Mirin"],
    staples: ["Reis", "Sojasauce", "Sesamöl", "Nori"],
  },
  indian: {
    nameTemplates: ["%s-Curry", "%s-Masala-Pfanne", "Würziges %s-Dal"],
    spices: ["Kurkuma", "Garam Masala", "Kreuzkümmel", "Koriander"],
    staples: ["Basmatireis", "Kokosmilch", "Linsen", "Ghee"],
  },
  gourmet: {
    nameTemplates: ["%s fein pochiert mit Beurre Blanc", "Confierte %s-Komposition", "%s Fine-Dining-Teller"],
    spices: ["Thymian", "Meersalz", "Butter", "Weißwein"],
    staples: ["Butter", "Sahne", "Weißwein", "Schalotten"],
  },
  fusion: {
    nameTemplates: ["%s-Fusion-Bowl", "Street-Food-Wrap mit %s", "Ofenpfanne %s Fusion-Style"],
    spices: ["Sojasauce", "Limette", "Chili", "Koriander"],
    staples: ["Sojasauce", "Limette", "Sesamöl", "Frühlingszwiebeln"],
  },
};

/** Staples considered unsuitable for a given diet preference. */
const DIET_EXCLUDED_STAPLES: Record<DietPreference, string[]> = {
  vegan: ["Butter", "Sahne", "Speck", "Parmesan", "Ghee"],
  vegetarian: ["Speck"],
  keto: ["Reis", "Basmatireis", "Pasta", "Mehl"],
  none: [],
};

/** Filters a cuisine's staples down to ones compatible with the given diet. */
export function dietSafeStaples(cuisine: CuisineStyle, diet: DietPreference): string[] {
  const excluded = DIET_EXCLUDED_STAPLES[diet];
  return CUISINE_PRESETS[cuisine].staples.filter(s => !excluded.includes(s));
}
