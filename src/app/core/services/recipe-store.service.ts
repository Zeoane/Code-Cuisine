import { Injectable, signal } from "@angular/core";
import { collection, doc, onSnapshot, orderBy, query, runTransaction } from "firebase/firestore";
import { firestore } from "../firebase/firebase-app";
import { CuisineStyle, GeneratedRecipe, StoredRecipe } from "../models/recipe.models";
import { readJson, writeJson } from "./local-storage.util";

const RECIPE_COLLECTION = "library_recipes";
const COUNTER_COLLECTION = "library_meta";
const COUNTER_DOC = "counter";
const LIKED_STORAGE_KEY = "cac_liked_recipes";

/** Every recipe of one cuisine, newest first. Pure, so it is unit-testable. */
export function filterByCuisine(recipes: StoredRecipe[], cuisine: CuisineStyle): StoredRecipe[] {
  return recipes.filter(recipe => recipe.cuisineStyle === cuisine);
}

/** The most liked recipes first, newest first among equal counts. */
export function sortByLikes(recipes: StoredRecipe[], limit: number): StoredRecipe[] {
  return [...recipes].sort((a, b) => b.likes - a.likes || b.id - a.id).slice(0, limit);
}

/**
 * The cookbook's recipe store, backed by Firestore so every generated recipe
 * is visible to everyone, on every device, with no account needed. Kept live
 * via `onSnapshot`; the readers below serve a local signal cache so callers
 * stay synchronous, matching how the components use them.
 *
 * Which recipes this browser has already liked lives in localStorage: there
 * are no accounts, so a like cannot be tied to a person. It keeps one browser
 * from inflating a count by clicking twice, which is as far as the honour
 * system goes here.
 */
@Injectable({ providedIn: "root" })
export class RecipeStoreService {
  private readonly recipes = signal<StoredRecipe[]>([]);
  private readonly likedIds = signal<number[]>(readJson<number[]>(LIKED_STORAGE_KEY, []));

  constructor() {
    if (!firestore) return;
    const recipesQuery = query(collection(firestore, RECIPE_COLLECTION), orderBy("id", "desc"));
    onSnapshot(recipesQuery, snapshot => {
      this.recipes.set(
        snapshot.docs.map(entry => {
          const data = entry.data() as StoredRecipe;
          return { ...data, likes: data.likes ?? 0 };
        }),
      );
    });
  }

  /**
   * Appends newly generated recipes and returns them with ids. Ids come from
   * a Firestore-side counter inside a transaction, so concurrent writers from
   * different browsers never collide.
   */
  async addGenerated(recipes: GeneratedRecipe[], helpers: number): Promise<StoredRecipe[]> {
    if (!firestore) return [];
    const db = firestore;
    const createdAt = new Date().toISOString();

    return runTransaction(db, async transaction => {
      const counterRef = doc(db, COUNTER_COLLECTION, COUNTER_DOC);
      const counterSnap = await transaction.get(counterRef);
      let nextId = (counterSnap.data()?.["value"] as number | undefined) ?? 0;

      const stored: StoredRecipe[] = recipes.map(recipe => {
        nextId += 1;
        return { ...recipe, id: nextId, helpers, createdAt, likes: 0 };
      });

      transaction.set(counterRef, { value: nextId });
      for (const recipe of stored) {
        transaction.set(doc(db, RECIPE_COLLECTION, String(recipe.id)), recipe);
      }
      return stored;
    });
  }

  /** Every stored recipe of one cuisine, newest first. */
  listByCuisine(cuisine: CuisineStyle): StoredRecipe[] {
    return filterByCuisine(this.recipes(), cuisine);
  }

  /** The most liked recipes, for the cookbook's "Most liked recipes" row. */
  listMostLiked(limit = 10): StoredRecipe[] {
    return sortByLikes(this.recipes(), limit);
  }

  /** Finds a single stored recipe by its id. */
  getById(id: number): StoredRecipe | undefined {
    return this.recipes().find(recipe => recipe.id === id);
  }

  /** True when this browser has already given the recipe a heart. */
  hasLiked(id: number): boolean {
    return this.likedIds().includes(id);
  }

  /** Current like count of a recipe, 0 while it is still loading. */
  likesOf(id: number): number {
    return this.getById(id)?.likes ?? 0;
  }

  /**
   * Adds or withdraws this browser's heart. The new count is written as an
   * absolute number inside a transaction rather than as an increment, so the
   * security rule can check it against the stored one and reject anything
   * further away than a single heart.
   */
  async toggleLike(id: number): Promise<void> {
    if (!firestore) return;
    const db = firestore;
    const wasLiked = this.hasLiked(id);
    const delta = wasLiked ? -1 : 1;

    this.likedIds.update(ids => (wasLiked ? ids.filter(entry => entry !== id) : [...ids, id]));
    writeJson(LIKED_STORAGE_KEY, this.likedIds());

    try {
      await runTransaction(db, async transaction => {
        const recipeRef = doc(db, RECIPE_COLLECTION, String(id));
        const snapshot = await transaction.get(recipeRef);
        if (!snapshot.exists()) return;
        const current = (snapshot.data()["likes"] as number | undefined) ?? 0;
        transaction.update(recipeRef, { likes: Math.max(0, current + delta) });
      });
    } catch {
      this.likedIds.update(ids => (wasLiked ? [...ids, id] : ids.filter(entry => entry !== id)));
      writeJson(LIKED_STORAGE_KEY, this.likedIds());
    }
  }
}
