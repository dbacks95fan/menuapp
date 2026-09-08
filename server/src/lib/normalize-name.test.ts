// ABOUTME: Tests for ingredient-name canonicalisation used as a grouping key.
import { describe, expect, it } from "vitest";
import { normalizeIngredientName } from "./normalize-name.js";

describe("normalizeIngredientName", () => {
  it.each([
    ["Tomatoes", "tomato"],
    ["  Fresh Basil Leaves ", "basil leaf"],
    ["onion, diced", "onion"],
    ["All-Purpose Flour (sifted)", "all-purpose flour"],
    ["Chicken Breasts", "chicken breast"],
    ["Berries", "berry"],
    ["Cloves", "clove"],
    ["Olive Oil", "olive oil"],
  ])("normalizes %j to %j", (input, expected) => {
    expect(normalizeIngredientName(input)).toBe(expected);
  });

  it("groups descriptor variants to the same key", () => {
    expect(normalizeIngredientName("2 large ripe tomatoes")).toBe(
      normalizeIngredientName("Tomato"),
    );
  });
});
