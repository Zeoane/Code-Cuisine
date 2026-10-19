/** Cooking style presets offered by the generator (User Story 4). */
export type CuisineStyle = "german" | "italian" | "japanese" | "indian" | "gourmet" | "fusion";

/** Dietary preferences that filter recipe ingredients (User Story 5). */
export type DietPreference = "vegetarian" | "vegan" | "keto" | "none";

/** Time budget categories the user can pick from (User Story 3). */
export type TimeCategory = "quick" | "medium" | "elaborate";

/** Difficulty levels shown on recipe meta badges. */
export type Difficulty = "easy" | "medium" | "hard";

/** A single chronological cooking instruction. */
export interface RecipeStep {
  /** Beginner-friendly instruction text. */
  instruction: string;
  /** Helper number (1-based) this step is assigned to. */
  assignedTo: number;
  /** True if this step can run in parallel with the previous one. */
  isParallel: boolean;
}

/** Per-serving nutrition facts (User Story 10). */
export interface NutritionInfo {
  caloriesPerServing: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

/** Options collected from the generator form that drive recipe creation. */
export interface GenerationOptions {
  ingredients: string[];
  servings: number;
  timeCategory: TimeCategory;
  cuisineStyle: CuisineStyle;
  diet: DietPreference;
  helpers: number;
}

/** One recipe suggestion produced by the generator. */
export interface GeneratedRecipe {
  title: string;
  description: string | null;
  ingredients: string[];
  missingIngredients: string[];
  steps: RecipeStep[];
  difficulty: Difficulty;
  cookingTimeMinutes: number;
  servings: number;
  cuisineStyle: CuisineStyle;
  nutrition: NutritionInfo | null;
}

/** A recipe saved in the cookbook, shared by everyone. */
export interface StoredRecipe extends GeneratedRecipe {
  id: number;
  helpers: number;
  createdAt: string;
  /** Hearts given by visitors; starts at zero and only ever counts real clicks. */
  likes: number;
}

/**
 * A recipe of the run that just finished. It gains its id once the cookbook
 * write has gone through, which is what lets the results view hand out hearts.
 */
export type ResultRecipe = GeneratedRecipe & { id?: number; helpers?: number };

/** Shape needed to render a recipe as a card, generated or stored. */
export type CardRecipe = GeneratedRecipe & { helpers?: number };

/** Unit a user can pick when entering an ingredient's quantity. */
export type IngredientUnit = "piece" | "ml" | "gram";

/** One ingredient collected in Step 1 of the generator wizard. */
export interface IngredientEntry {
  id: number;
  name: string;
  quantity: number;
  unit: IngredientUnit;
}
