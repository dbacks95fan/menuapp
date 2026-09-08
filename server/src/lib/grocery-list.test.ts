// ABOUTME: Tests for combining selected-recipe ingredients into a grocery list.
import { describe, expect, it } from "vitest";
import { buildGroceryList, type GroceryInput } from "./grocery-list.js";

function ing(
  recipeId: number,
  recipeName: string,
  name: string,
  quantity: number | null,
  unit: string | null,
): GroceryInput {
  return { recipeId, recipeName, name, quantity, unit };
}

describe("buildGroceryList", () => {
  it("adds compatible quantities of the same ingredient", () => {
    const lines = buildGroceryList([
      ing(1, "A", "flour", 1, "cup"),
      ing(2, "B", "Flour", 2, "cup"),
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ name: "flour", normalizedName: "flour" });
    expect(lines[0].quantities).toEqual([{ quantity: 3, unit: "cup" }]);
    expect(lines[0].contributions).toHaveLength(2);
  });

  it("keeps incompatible units as separate quantities on one line", () => {
    const lines = buildGroceryList([
      ing(1, "A", "chicken", 500, "g"),
      ing(2, "B", "chicken", 2, "lb"),
      ing(3, "C", "chicken", 1, "can"),
    ]);
    expect(lines).toHaveLength(1);
    // g + lb combine (mass family); can stays separate.
    expect(lines[0].quantities).toHaveLength(2);
    const canBucket = lines[0].quantities.find((q) => q.unit === "can");
    expect(canBucket).toEqual({ quantity: 1, unit: "can" });
  });

  it("groups descriptor variants and sorts lines by name", () => {
    const lines = buildGroceryList([
      ing(1, "A", "Zucchini", 2, null),
      ing(2, "B", "2 ripe tomatoes", null, null),
      ing(3, "C", "tomato", 1, null),
    ]);
    expect(lines.map((l) => l.normalizedName)).toEqual(["tomato", "zucchini"]);
    const tomato = lines[0];
    // one has a null quantity, so the total is unknowable but nothing is dropped
    expect(tomato.quantities[0].quantity).toBeNull();
    expect(tomato.contributions).toHaveLength(2);
  });

  it("counts each recipe contribution once", () => {
    const lines = buildGroceryList([
      ing(1, "Chili", "beans", 1, "can"),
      ing(1, "Chili", "beans", 1, "can"),
    ]);
    expect(lines[0].quantities).toEqual([{ quantity: 2, unit: "can" }]);
    expect(lines[0].contributions).toHaveLength(2);
  });
});
