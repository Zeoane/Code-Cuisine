import { Injectable, signal } from "@angular/core";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
} from "firebase/firestore";
import { firestore } from "../firebase/firebase-app";
import { CuisineStyle, GeneratedRecipe, StoredRecipe } from "../models/recipe.models";

const LIBRARY_COLLECTION = "library_recipes";
const COUNTER_COLLECTION = "library_meta";
const COUNTER_DOC = "counter";
const PAGE_SIZE = 20;

/** One page of the public recipe library. */
export interface LibraryPage {
  recipes: StoredRecipe[];
  total: number;
  pageSize: number;
  page: number;
}

/** Slices a cuisine-filtered page out of a full recipe list. Pure, so it's unit-testable without Firestore. */
export function paginateLibrary(recipes: StoredRecipe[], page: number, cuisine?: CuisineStyle): LibraryPage {
  const filtered = recipes.filter(r => !cuisine || r.cuisineStyle === cuisine);
  const start = (page - 1) * PAGE_SIZE;
  return {
    recipes: filtered.slice(start, start + PAGE_SIZE),
    total: filtered.length,
    pageSize: PAGE_SIZE,
    page,
  };
}

/**
 * Public recipe library (User Stories 12-14), backed by Firestore so every
 * generated recipe is visible to everyone, on every device, with no account
 * needed. Kept live via `onSnapshot`; `list`/`getById` read a local signal
 * cache so callers stay synchronous, matching how the components use them.
 */
@Injectable({ providedIn: "root" })
export class LibraryService {
  private readonly recipes = signal<StoredRecipe[]>([]);

  constructor() {
    if (!firestore) return;
    const recipesQuery = query(collection(firestore, LIBRARY_COLLECTION), orderBy("id", "desc"));
    onSnapshot(recipesQuery, snapshot => {
      this.recipes.set(snapshot.docs.map(d => d.data() as StoredRecipe));
    });
  }

  /**
   * Appends newly generated recipes to the shared library and returns them
   * with ids. Ids are assigned from a Firestore-side counter inside a
   * transaction so concurrent writers from different browsers never collide.
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
        return { ...recipe, id: nextId, helpers, createdAt };
      });

      transaction.set(counterRef, { value: nextId });
      for (const recipe of stored) {
        transaction.set(doc(db, LIBRARY_COLLECTION, String(recipe.id)), recipe);
      }
      return stored;
    });
  }

  /** Returns a paginated, optionally cuisine-filtered slice of the library. */
  list(page: number, cuisine?: CuisineStyle): LibraryPage {
    return paginateLibrary(this.recipes(), page, cuisine);
  }

  /** Finds a single library recipe by its id. */
  getById(id: number): StoredRecipe | undefined {
    return this.recipes().find(r => r.id === id);
  }
}
