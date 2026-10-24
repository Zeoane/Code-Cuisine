import {
  INGREDIENT_SUGGESTIONS,
  canonicalIngredient,
  isKnownIngredient,
} from "./ingredient-suggestions";

// This lookup is what keeps a typo out of the ingredient list and out of the
// generated recipe: "Cheesee" has no recipe behind it, so the add button has
// to stay disabled for it. Worth pinning down, since the whole guard on the
// generator page rests on these two functions.
describe("canonicalIngredient", () => {
  it("returns the list's own spelling for an exact match", () => {
    expect(canonicalIngredient("Cheese")).toBe("Cheese");
  });

  it("accepts any casing and normalises it", () => {
    expect(canonicalIngredient("cheese")).toBe("Cheese");
    expect(canonicalIngredient("CHEESE")).toBe("Cheese");
  });

  it("ignores surrounding whitespace", () => {
    expect(canonicalIngredient("  cheese  ")).toBe("Cheese");
  });

  it("rejects a misspelled name", () => {
    expect(canonicalIngredient("Cheesee")).toBeNull();
  });

  it("rejects a name that is only the start of a suggestion", () => {
    expect(canonicalIngredient("Chees")).toBeNull();
  });

  it("rejects an empty field", () => {
    expect(canonicalIngredient("   ")).toBeNull();
  });
});

describe("isKnownIngredient", () => {
  it("accepts every name the suggestion list offers", () => {
    const rejected = INGREDIENT_SUGGESTIONS.filter(name => !isKnownIngredient(name));
    expect(rejected).toEqual([]);
  });

  it("rejects free text that is not on the list", () => {
    expect(isKnownIngredient("Cheesee")).toBe(false);
  });
});
