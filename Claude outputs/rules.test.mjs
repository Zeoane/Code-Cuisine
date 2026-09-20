/**
 * Prüft firestore.rules gegen den echten Firestore-Emulator.
 * Läuft über: firebase emulators:exec --only firestore "node rules.test.mjs"
 */
import fs from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";

const RULES = "/home/claude/work/cac/firestore.rules";

/** Exakt das Dokument, das LibraryService.addGenerated() schreibt. */
function validRecipe(id = 1) {
  return {
    id,
    title: "Pasta al Tomatoes",
    description: "Pasta al Tomatoes, finished with Basil – quickly prepared.",
    ingredients: ["160 g Tomatoes"],
    missingIngredients: ["Olive oil", "Parmesan", "Pasta"],
    steps: [
      { instruction: "Wash and prepare Tomatoes.", assignedTo: 1, isParallel: false },
      { instruction: "Get Olive oil ready.", assignedTo: 1, isParallel: true },
    ],
    difficulty: "easy",
    cookingTimeMinutes: 25,
    servings: 2,
    cuisineStyle: "italian",
    nutrition: { caloriesPerServing: 520, proteinGrams: 28, carbsGrams: 55, fatGrams: 18 },
    helpers: 1,
    createdAt: "2026-09-20T10:15:00.000Z",
  };
}

let passed = 0;
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ✗ ${name}\n      ${String(error).split("\n")[0]}`);
    failed++;
  }
}

const env = await initializeTestEnvironment({
  projectId: "cac-rules-test",
  firestore: { rules: fs.readFileSync(RULES, "utf8"), host: "127.0.0.1", port: 8080 },
});

const db = env.unauthenticatedContext().firestore();

console.log("\nlibrary_recipes — was die App schreibt, muss durchgehen");
await check("gültiges Rezept anlegen", () =>
  assertSucceeds(setDoc(doc(db, "library_recipes/1"), validRecipe(1))),
);
await check("description = null erlaubt", () =>
  assertSucceeds(setDoc(doc(db, "library_recipes/2"), { ...validRecipe(2), description: null })),
);
await check("nutrition = null erlaubt", () =>
  assertSucceeds(setDoc(doc(db, "library_recipes/3"), { ...validRecipe(3), nutrition: null })),
);
await check("jeder darf lesen", () => assertSucceeds(getDoc(doc(db, "library_recipes/1"))));

console.log("\nlibrary_recipes — Angriffe müssen scheitern");
await check("Fremdfeld mit 900 KB Ballast", () =>
  assertFails(
    setDoc(doc(db, "library_recipes/900001"), { ...validRecipe(900001), junk: "x".repeat(900_000) }),
  ),
);
await check("überlanger Titel (5000 Zeichen)", () =>
  assertFails(setDoc(doc(db, "library_recipes/900002"), { ...validRecipe(900002), title: "x".repeat(5000) })),
);
await check("leerer Titel", () =>
  assertFails(setDoc(doc(db, "library_recipes/900003"), { ...validRecipe(900003), title: "" })),
);
await check("Doc-ID passt nicht zur id", () =>
  assertFails(setDoc(doc(db, "library_recipes/777"), validRecipe(900004))),
);
await check("unbekannte cuisineStyle", () =>
  assertFails(setDoc(doc(db, "library_recipes/900005"), { ...validRecipe(900005), cuisineStyle: "klingon" })),
);
await check("unbekannte difficulty", () =>
  assertFails(setDoc(doc(db, "library_recipes/900006"), { ...validRecipe(900006), difficulty: "trivial" })),
);
await check("servings ausserhalb 1-12", () =>
  assertFails(setDoc(doc(db, "library_recipes/900007"), { ...validRecipe(900007), servings: 9999 })),
);
await check("2000 Zutaten", () =>
  assertFails(
    setDoc(doc(db, "library_recipes/900008"), {
      ...validRecipe(900008),
      ingredients: Array.from({ length: 2000 }, (_, i) => `Zutat ${i}`),
    }),
  ),
);
await check("Pflichtfeld fehlt (createdAt)", () => {
  const { createdAt, ...rest } = validRecipe(900009);
  return assertFails(setDoc(doc(db, "library_recipes/900009"), rest));
});
await check("bestehendes Rezept überschreiben", () =>
  assertFails(updateDoc(doc(db, "library_recipes/1"), { title: "gekapert" })),
);
await check("bestehendes Rezept löschen", () =>
  assertFails(deleteDoc(doc(db, "library_recipes/1"))),
);

console.log("\nlibrary_meta/counter — Zähler darf nur vorwärts");
await check("erster Zähler (value 3)", () =>
  assertSucceeds(setDoc(doc(db, "library_meta/counter"), { value: 3 })),
);
await check("normale Generierung: +3", () =>
  assertSucceeds(setDoc(doc(db, "library_meta/counter"), { value: 6 })),
);
await check("Reset auf 0 — B3", () =>
  assertFails(setDoc(doc(db, "library_meta/counter"), { value: 0 })),
);
await check("Rückwärts auf 2", () =>
  assertFails(setDoc(doc(db, "library_meta/counter"), { value: 2 })),
);
await check("gleicher Wert nochmal", () =>
  assertFails(setDoc(doc(db, "library_meta/counter"), { value: 6 })),
);
await check("Sprung um +5000", () =>
  assertFails(setDoc(doc(db, "library_meta/counter"), { value: 5006 })),
);
await check("Fremdfeld im Zähler", () =>
  assertFails(setDoc(doc(db, "library_meta/counter"), { value: 7, evil: true })),
);
await check("Zähler löschen", () => assertFails(deleteDoc(doc(db, "library_meta/counter"))));

console.log("\nquota — bleibt für Clients dicht");
await check("quota_ip lesen verboten", () =>
  assertFails(getDoc(doc(db, "quota_ip/2026-09-20_abc"))),
);
await check("quota_ip schreiben verboten", () =>
  assertFails(setDoc(doc(db, "quota_ip/2026-09-20_abc"), { count: 0 })),
);
await check("quota_total schreiben verboten", () =>
  assertFails(setDoc(doc(db, "quota_total/2026-09-20"), { count: 0 })),
);

await env.cleanup();
console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
process.exit(failed ? 1 : 0);
