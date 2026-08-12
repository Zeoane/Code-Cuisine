import { CuisineStyle } from "../models/recipe.models";

/** One row of a cuisine's recipe list. */
export interface CuisineRecipe {
  id: number;
  title: string;
  cookingTimeMinutes: number;
  tags: string[];
  likes: number;
}

/** Banner artwork shown above each cuisine's recipe list. */
export const CUISINE_BANNERS: Record<CuisineStyle, string> = {
  italian: "banner-italian.webp",
  german: "banner-german.svg",
  japanese: "banner-japanese.svg",
  gourmet: "banner-gourmet.svg",
  indian: "banner-indian.svg",
  fusion: "banner-fusion.svg",
};

/** Recipes per page, matching the Figma list. */
export const RECIPES_PER_PAGE = 15;

/**
 * Demo recipes per cuisine. These stand in until the n8n workflow scrapes and
 * transforms real recipes and Firebase serves them.
 */
const DEMO_TITLES: Record<CuisineStyle, { title: string; minutes: number; tags: string[]; likes: number }[]> = {
  italian: [
    { title: "Pasta with spinach and cherry tommatoes", minutes: 20, tags: ["Vegetarian", "Quick"], likes: 66 },
    { title: "Creamy garlic shrimp pasta", minutes: 22, tags: ["Quick"], likes: 32 },
    { title: "Funghi salami pizza", minutes: 16, tags: ["Quick"], likes: 42 },
  ],
  german: [
    { title: "Schnitzel with potato salad", minutes: 45, tags: ["Complex"], likes: 51 },
    { title: "Käsespätzle with roasted onions", minutes: 35, tags: ["Vegetarian"], likes: 38 },
    { title: "Pretzel dumplings with mushroom sauce", minutes: 40, tags: ["Vegetarian"], likes: 27 },
  ],
  japanese: [
    { title: "Salmon nigiri with wasabi", minutes: 30, tags: ["Quick"], likes: 44 },
    { title: "Miso ramen with soft-boiled egg", minutes: 40, tags: ["Complex"], likes: 61 },
    { title: "Vegetable maki rolls", minutes: 25, tags: ["Vegan", "Quick"], likes: 35 },
  ],
  gourmet: [
    { title: "Duck breast with cherry jus", minutes: 55, tags: ["Complex"], likes: 48 },
    { title: "Truffle risotto with parmesan crisp", minutes: 45, tags: ["Vegetarian"], likes: 39 },
    { title: "Seared scallops on pea purée", minutes: 35, tags: ["Quick"], likes: 29 },
  ],
  indian: [
    { title: "Chana masala with basmati rice", minutes: 35, tags: ["Vegan"], likes: 57 },
    { title: "Butter chicken with naan", minutes: 45, tags: ["Complex"], likes: 64 },
    { title: "Palak paneer with cumin rice", minutes: 30, tags: ["Vegetarian", "Quick"], likes: 41 },
  ],
  fusion: [
    { title: "Kimchi carbonara", minutes: 25, tags: ["Quick"], likes: 52 },
    { title: "Teriyaki pulled pork bao", minutes: 50, tags: ["Complex"], likes: 46 },
    { title: "Miso mushroom tacos", minutes: 20, tags: ["Vegan", "Quick"], likes: 33 },
  ],
};

/** Total demo recipes generated per cuisine (5 pages of 15 + a short last page). */
const DEMO_COUNT = 116;

/** Builds the demo recipe list for a cuisine. */
export function recipesFor(cuisine: CuisineStyle): CuisineRecipe[] {
  const base = DEMO_TITLES[cuisine];
  return Array.from({ length: DEMO_COUNT }, (_, index) => {
    const entry = base[index % base.length];
    return { id: index + 1, ...entry, cookingTimeMinutes: entry.minutes };
  });
}
