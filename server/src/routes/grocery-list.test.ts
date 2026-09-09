import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { db } from "../db/index.js";

const app = createApp();

async function recipeWith(name: string, ingredients: unknown[]): Promise<number> {
  const res = await request(app).post("/api/recipes").send({ name, ingredients });
  return res.body.id as number;
}

describe("grocery-list API", () => {
  beforeEach(() => {
    db.exec(
      "DELETE FROM pantry_items; DELETE FROM meal_selections; DELETE FROM ingredients; DELETE FROM recipes;",
    );
  });

  it("combines ingredients across the selected recipes", async () => {
    const a = await recipeWith("A", [{ name: "flour", quantity: 1, unit: "cup" }]);
    const b = await recipeWith("B", [
      { name: "Flour", quantity: 2, unit: "cups" },
      { name: "salt", quantity: 1, unit: "tsp" },
    ]);
    await request(app).post("/api/selections").send({ recipeId: a });
    await request(app).post("/api/selections").send({ recipeId: b });

    const res = await request(app).get("/api/grocery-list");
    expect(res.status).toBe(200);
    expect(res.body.recipeCount).toBe(2);
    const flour = res.body.lines.find((l: { normalizedName: string }) => l.normalizedName === "flour");
    expect(flour.quantities).toEqual([{ quantity: 3, unit: "cup" }]);
    expect(flour.contributions).toHaveLength(2);
    expect(flour.inPantry).toBe(false);
  });

  it("flags lines that match a pantry item but still includes them", async () => {
    const a = await recipeWith("A", [{ name: "olive oil", quantity: 2, unit: "tbsp" }]);
    await request(app).post("/api/selections").send({ recipeId: a });
    await request(app).post("/api/pantry").send({ name: "Olive Oil" });

    const res = await request(app).get("/api/grocery-list");
    expect(res.body.lines).toHaveLength(1);
    expect(res.body.lines[0]).toMatchObject({ normalizedName: "olive oil", inPantry: true });
  });

  it("is empty when nothing is selected", async () => {
    const res = await request(app).get("/api/grocery-list");
    expect(res.body).toEqual({ lines: [], recipeCount: 0 });
  });
});
