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
  "bison", "boar", "escargot", "escargots", "foie", "guanciale",
  "jamon", "jerky", "kielbasa", "marshmallow", "marshmallows", "mincemeat",
  "nduja", "partridge", "pigeon", "quail", "speck", "tripe",
  "anchovies", "anchovy", "bass", "bream", "calamari", "carp", "caviar", "clam",
  "clams", "cod", "crab", "crayfish", "eel", "fish", "haddock", "hake", "halibut",
  "herring", "lobster", "mackerel", "monkfish", "mussels", "octopus", "oyster",
  "oysters", "perch", "pike", "pilchards", "plaice", "pollock", "prawn", "prawns",
  "roe", "salmon", "sardine", "sardines", "scallop", "scallops", "seafood",
  "shrimp", "shrimps", "snapper", "sprat", "squid", "surimi", "tilapia", "trout",
  "tuna", "whitebait",
];

/** Names that are only animal food as a whole phrase, never word by word. */
// prettier-ignore
const FLESH_PHRASES = ["black pudding", "blood sausage", "parma ham", "serrano ham"];

/** Words that mark an ingredient as an animal product but not as flesh. */
// prettier-ignore
const ANIMAL_PRODUCT_WORDS = [
  "aioli", "asiago", "brie", "burrata", "butter", "buttermilk", "camembert",
  "casein", "cheddar", "cheese", "colby", "comte", "cream", "creme", "curd",
  "custard", "edam", "egg", "eggs", "emmental", "emmentaler", "feta", "ghee",
  "gorgonzola", "gouda", "gruyere", "halloumi", "havarti", "hollandaise", "honey",
  "kefir", "labneh", "manchego", "mascarpone", "mayo", "mayonnaise", "meringue",
  "milk", "mozzarella", "paneer", "parmesan", "parmigiano", "pecorino",
  "provolone", "quark", "queso", "reggiano", "ricotta", "roquefort", "skyr",
  "stilton", "taleggio", "whey", "yoghurt", "yogurt",
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
  "arrowroot", "barley", "bulgur", "cornflakes", "croissant", "crumpet",
  "dextrose", "doughnut", "donut", "dumpling", "dumplings", "farro", "fructose",
  "glucose", "gnocchi", "granola", "jam", "jelly", "ketchup", "maltodextrin",
  "marmalade",
  "millet", "molasses", "muesli", "pancake", "pancakes", "pretzel", "pretzels",
  "quinoa", "ravioli", "scone", "semolina", "tapioca", "tortellini", "treacle",
  "waffle", "wonton",
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

/**
 * Reduces a name to plain lower-case words. Accents are folded first, because
 * stripping them naively turns "Jamón" into "jam" plus a stray "n" - which
 * both hides the ham and looks like the sugar word "jam".
 */
function words(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
  if (hasWord(tokens, FLESH_WORDS) || FLESH_PHRASES.includes(tokens.join(" "))) return true;
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
