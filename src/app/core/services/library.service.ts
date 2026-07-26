import { Injectable } from "@angular/core";
import { CuisineStyle, GeneratedRecipe, StoredRecipe } from "../models/recipe.models";
import { readJson, writeJson } from "./local-storage.util";

const STORAGE_KEY = "cac_library_recipes";
const PAGE_SIZE = 20;

/** One page of the public recipe library. */
export interface LibraryPage {
  recipes: StoredRecipe[];
  total: number;
  pageSize: number;
  page: number;
}

/**
 * Public recipe library (User Stories 12-14), persisted to localStorage for
 * now. Every generated recipe lands here so it stays visible to everyone
 * using this browser; a Firebase-backed shared library follows later.
 */
@Injectable({ providedIn: "root" })
export class LibraryService {
  /** Appends newly generated recipes to the library and returns them with ids. */
  addGenerated(recipes: GeneratedRecipe[], helpers: number): StoredRecipe[] {
    const all = this.readAll();
    const stored = this.assignIds(recipes, helpers, all);
    this.writeAll([...stored, ...all]);
    return stored;
  }

  /** Returns a paginated, optionally cuisine-filtered slice of the library. */
  list(page: number, cuisine?: CuisineStyle): LibraryPage {
    const filtered = this.readAll().filter(r => !cuisine || r.cuisineStyle === cuisine);
    const start = (page - 1) * PAGE_SIZE;
    return {
      recipes: filtered.slice(start, start + PAGE_SIZE),
      total: filtered.length,
      pageSize: PAGE_SIZE,
      page,
    };
  }

  /** Finds a single library recipe by its id. */
  getById(id: number): StoredRecipe | undefined {
    return this.readAll().find(r => r.id === id);
  }

  /** Assigns sequential ids to newly generated recipes. */
  private assignIds(
    recipes: GeneratedRecipe[],
    helpers: number,
    existing: StoredRecipe[],
  ): StoredRecipe[] {
    let nextId = existing.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    return recipes.map(recipe => ({
      ...recipe,
      id: nextId++,
      helpers,
      createdAt: new Date().toISOString(),
    }));
  }

  /** Reads the full library array from localStorage. */
  private readAll(): StoredRecipe[] {
    return readJson<StoredRecipe[]>(STORAGE_KEY, []);
  }

  /** Persists the full library array to localStorage. */
  private writeAll(recipes: StoredRecipe[]): void {
    writeJson(STORAGE_KEY, recipes);
  }
}
