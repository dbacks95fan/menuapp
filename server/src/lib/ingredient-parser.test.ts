// ABOUTME: Tests for the deterministic free-text ingredient line parser.
import { describe, expect, it } from "vitest";
import { parseIngredientLine } from "./ingredient-parser.js";

describe("parseIngredientLine", () => {
  it.each([
    ["2 cups all-purpose flour", { quantity: 2, unit: "cup", name: "all-purpose flour", note: null }],
    ["1 1/2 tsp salt", { quantity: 1.5, unit: "tsp", name: "salt", note: null }],
    ["½ cup sugar", { quantity: 0.5, unit: "cup", name: "sugar", note: null }],
    ["3 large eggs", { quantity: 3, unit: null, name: "large eggs", note: null }],
    ["1 lb ground beef, drained", { quantity: 1, unit: "lb", name: "ground beef", note: "drained" }],
    ["Salt and pepper to taste", { quantity: null, unit: null, name: "Salt and pepper to taste", note: null }],
    ["2-3 cloves garlic, minced", { quantity: 3, unit: "clove", name: "garlic", note: "minced" }],
    ["- 1 onion (finely chopped)", { quantity: 1, unit: null, name: "onion", note: "finely chopped" }],
    ["a pinch of nutmeg", { quantity: 1, unit: "pinch", name: "nutmeg", note: null }],
    ["400g canned tomatoes", { quantity: 400, unit: "g", name: "canned tomatoes", note: null }],
  ])("parses %j", (input, expected) => {
    expect(parseIngredientLine(input)).toMatchObject(expected);
  });

  it("keeps the raw line", () => {
    expect(parseIngredientLine("  2 cups flour  ").raw).toBe("2 cups flour");
  });

  it("never returns an empty name", () => {
    expect(parseIngredientLine("2 cups").name).not.toBe("");
  });
});
