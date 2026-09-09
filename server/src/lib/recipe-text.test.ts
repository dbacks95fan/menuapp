// ABOUTME: Tests for extracting a draft recipe from pasted free-text.
import { describe, expect, it } from "vitest";
import { extractRecipeFromText } from "./recipe-text.js";

describe("extractRecipeFromText", () => {
  it("uses an Ingredients section when present and stops at directions", () => {
    const text = [
      "Grandma's Chili",
      "Serves 6",
      "",
      "Ingredients",
      "2 lbs ground beef",
      "1 onion, diced",
      "2 cans kidney beans",
      "",
      "Instructions",
      "Brown the beef. Add everything else. Simmer.",
    ].join("\n");

    const recipe = extractRecipeFromText(text);
    expect(recipe.name).toBe("Grandma's Chili");
    expect(recipe.servings).toBe(6);
    expect(recipe.ingredients.map((i) => i.name)).toEqual([
      "ground beef",
      "onion",
      "kidney beans",
    ]);
    expect(recipe.ingredients[0]).toMatchObject({ quantity: 2, unit: "lb" });
  });

  it("falls back to ingredient-looking lines when there is no header", () => {
    const text = [
      "Quick Toast",
      "2 slices bread",
      "1 tbsp butter",
      "Toast the bread and spread the butter on top while warm.",
    ].join("\n");

    const recipe = extractRecipeFromText(text);
    expect(recipe.name).toBe("Quick Toast");
    expect(recipe.ingredients.map((i) => i.name)).toEqual(["bread", "butter"]);
  });

  it("returns an empty ingredient list rather than throwing on junk", () => {
    expect(() => extractRecipeFromText("")).not.toThrow();
    expect(extractRecipeFromText("").ingredients).toEqual([]);
  });
});
