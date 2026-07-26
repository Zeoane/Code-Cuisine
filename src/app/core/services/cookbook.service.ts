import { Injectable } from "@angular/core";
import { GeneratedRecipe, StoredRecipe } from "../models/recipe.models";
import { readJson, writeJson } from "./local-storage.util";

const STORAGE_KEY = "cac_cookbook_recipes";

/**
 * Personal cookbook (User Story 5/12 in the school-project checklist),
 * persisted to localStorage. No login is required in this phase; Firebase
 * Auth plus per-user sync will replace this once it is wired in.
 */
@Injectable({ providedIn: "root" })
export class CookbookService {
  /** Returns all recipes saved to the cookbook, newest first. */
  list(): StoredRecipe[] {
    return readJson<StoredRecipe[]>(STORAGE_KEY, []);
  }

  /** Saves a generated recipe into the cookbook and returns the stored copy. */
  save(recipe: GeneratedRecipe, helpers: number): StoredRecipe {
    const all = this.list();
    const nextId = all.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const stored: StoredRecipe = {
      ...recipe,
      id: nextId,
      helpers,
      createdAt: new Date().toISOString(),
    };
    writeJson(STORAGE_KEY, [stored, ...all]);
    return stored;
  }

  /** Removes a recipe from the cookbook by id. */
  remove(id: number): void {
    writeJson(
      STORAGE_KEY,
      this.list().filter(r => r.id !== id),
    );
  }

  /** True if a recipe with this title is already saved. */
  isSaved(title: string): boolean {
    return this.list().some(r => r.title === title);
  }
}
