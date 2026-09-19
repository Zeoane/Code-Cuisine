import { DietPreference, IngredientEntry } from "../models/recipe.models";

/**
 * Words that mark an ingredient as meat, poultry, fish or seafood. Matched as
 * whole words, so "Butternut Squash" or "Hamburger Bun" stay clear of them.
 */
// prettier-ignore
const FLESH_WORDS = [
  "bacon", "beef", "bratwurst", "brisket", "chicken", "chorizo", "duck", "gammon",
  "gelatin", "gelatine", "goose", "ham", "lamb", "lard", "liver", "meat", "mince",
  "mutton", "oxtail", "pancetta", "pastrami", "pepperoni", "pheasant", "pork",
  "prosciutto", "rabbit", "salami", "sausage", "sausages", "steak", "suet",
  "turkey", "veal", "venison",
  "anchovies", "anchovy", "calamari", "clam", "clams", "cod", "crab", "crayfish",
  "eel", "fish", "haddock", "halibut", "herring", "lobster", "mackerel", "monkfish",
  "mussels", "octopus", "oyster", "oysters", "pilchards", "prawn", "prawns",
  "salmon", "sardine", "sardines", "scallop", "scallops", "seafood", "shrimp",
  "shrimps", "squid", "trout", "tuna",
];

/** Words that mark an ingredient as an animal product but not as flesh. */
// prettier-ignore
const ANIMAL_PRODUCT_WORDS = [
  "butter", "buttermilk", "cheddar", "cheese", "cream", "creme", "curd", "custard",
  "egg", "eggs", "feta", "ghee", "gorgonzola", "gruyere", "halloumi", "honey",
  "mascarpone", "milk", "mozzarella", "paneer", "parmesan", "pecorino", "ricotta",
  "stilton", "yoghurt", "yogurt",
];

/** Words that make an ingredient unsuitable for a ketogenic diet. */
// prettier-ignore
const HIGH_CARB_WORDS = [
  "bagel", "baguette", "banana", "biscuit", "biscuits", "bread", "breadcrumbs",
  "brioche", "bun", "buns", "cake", "cornflour", "cornstarch", "couscous",
  "croutons", "flour", "honey", "lasagne", "macaroni", "noodle", "noodles", "oats",
  "pasta", "pastry", "penne", "polenta", "potato", "potatoes", "rice", "risotto",
  "spaghetti", "sugar", "syrup", "tagliatelle", "tortilla", "tortillas", "wrap",
  "wraps",
];

/**
 * Plant sources that turn an animal word into a plant product: "Coconut Milk"
 * and "Peanut Butter" are vegan, "Buttermilk" is not.
 */
// prettier-ignore
const PLANT_SOURCES = [
  "almond", "cashew", "cocoa", "coconut", "flax", "hazelnut", "hemp", "macadamia",
  "nut", "oat", "palm", "peanut", "pistachio", "rice", "sesame", "soy", "soya",
];

/** Words in a name that declare the product free of animal ingredients. */
const PLANT_LABELS = ["vegan", "plant", "dairyfree", "eggless"];

/**
 * Words that cancel a high-carb match when they follow it: almond flour and
 * rice vinegar are fine on keto, wheat flour and sushi rice are not.
 */
const LOW_CARB_FOLLOWERS: Record<string, string[]> = {
  banana: ["leaf", "leaves", "pepper", "peppers"],
  rice: ["vinegar", "wine", "paper"],
  sugar: ["snap"],
};

/** Sources whose flour is nut- or seed-based and therefore low in carbs. */
const LOW_CARB_FLOUR_SOURCES = ["almond", "coconut", "flax", "flaxseed", "hazelnut", "sesame"];

/** Names that contain a flagged word but are plant food all the same. */
// prettier-ignore
const PLANT_EXCEPTIONS = [
  "beef tomato", "beef tomatoes", "butter bean", "butter beans",
  "butterhead lettuce", "butter lettuce", "crab apple", "crab apples",
  "cream of tartar", "duck sauce", "egg plant", "egg plants", "kidney bean",
  "kidney beans", "lamb s lettuce", "lambs lettuce", "milk thistle",
  "oyster mushroom", "oyster mushrooms",
];

/** Lower-cases a name and reduces it to plain words, so matching is reliable. */
function words(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

/** True when the name is a known plant food that merely reads like an animal one. */
function isPlantException(tokens: string[]): boolean {
  if (PLANT_EXCEPTIONS.includes(tokens.join(" "))) return true;
  return tokens.some(token => PLANT_LABELS.includes(token));
}

/** True when any of `list` appears as a whole word in the ingredient name. */
function hasWord(tokens: string[], list: string[]): boolean {
  return tokens.some(token => list.includes(token));
}

/** True when this high-carb word is cancelled by the word next to it. */
function isLowCarbInContext(tokens: string[], index: number): boolean {
  const token = tokens[index];
  if (token === "flour") return LOW_CARB_FLOUR_SOURCES.includes(tokens[index - 1] ?? "");
  const followers = LOW_CARB_FOLLOWERS[token];
  return followers !== undefined && followers.includes(tokens[index + 1] ?? "");
}

/** True when the ingredient cannot be part of a recipe for the given diet. */
export function conflictsWithDiet(name: string, diet: DietPreference): boolean {
  if (diet === "none") return false;
  const tokens = words(name);
  if (!tokens.length || isPlantException(tokens)) return false;

  if (diet === "keto") {
    return tokens.some(
      (token, index) => HIGH_CARB_WORDS.includes(token) && !isLowCarbInContext(tokens, index),
    );
  }

  // Meat, fish and seafood rule out both vegetarian and vegan.
  if (hasWord(tokens, FLESH_WORDS)) return true;
  if (diet === "vegetarian") return false;

  return tokens.some(
    (token, index) =>
      ANIMAL_PRODUCT_WORDS.includes(token) && !PLANT_SOURCES.includes(tokens[index - 1] ?? ""),
  );
}

/** The entered ingredients that clash with the selected diet. */
export function conflictingIngredients(
  entries: IngredientEntry[],
  diet: DietPreference,
): IngredientEntry[] {
  return entries.filter(entry => conflictsWithDiet(entry.name, diet));
}

/** The entered ingredients a recipe for this diet may actually use. */
export function dietSafeIngredients(
  entries: IngredientEntry[],
  diet: DietPreference,
): IngredientEntry[] {
  return entries.filter(entry => !conflictsWithDiet(entry.name, diet));
}
