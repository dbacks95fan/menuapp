// ABOUTME: Tests for pulling a recipe out of a page's JSON-LD.
import { describe, expect, it } from "vitest";
import { extractRecipeFromHtml } from "./recipe-jsonld.js";

const page = (jsonld: unknown) =>
  `<html><head><script type="application/ld+json">${JSON.stringify(jsonld)}</script></head><body></body></html>`;

describe("extractRecipeFromHtml", () => {
  it("reads a plain Recipe object", () => {
    const html = page({
      "@context": "https://schema.org",
      "@type": "Recipe",
      name: "Sheet Pan Fajitas",
      recipeYield: "4 servings",
      recipeIngredient: ["1 lb chicken breast, sliced", "2 bell peppers", "1 tsp cumin"],
    });
    const recipe = extractRecipeFromHtml(html);
    expect(recipe?.name).toBe("Sheet Pan Fajitas");
    expect(recipe?.servings).toBe(4);
    expect(recipe?.ingredients.map((i) => i.name)).toEqual([
      "chicken breast",
      "bell peppers",
      "cumin",
    ]);
    expect(recipe?.ingredients[0]).toMatchObject({ quantity: 1, unit: "lb" });
  });

  it("finds the Recipe inside an @graph array", () => {
    const html = page({
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebSite", name: "Some Blog" },
        { "@type": ["Recipe", "NewsArticle"], name: "Graph Soup", recipeIngredient: ["water"] },
      ],
    });
    expect(extractRecipeFromHtml(html)?.name).toBe("Graph Soup");
  });

  it("returns null when there is no recipe", () => {
    expect(extractRecipeFromHtml(page({ "@type": "WebPage", name: "Not a recipe" }))).toBeNull();
    expect(extractRecipeFromHtml("<html><body>nothing</body></html>")).toBeNull();
  });
});
