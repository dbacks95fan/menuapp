import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { db } from "../db/index.js";

const app = createApp();

function reset() {
  db.exec("DELETE FROM ingredients; DELETE FROM recipes;");
}

const pancakes = {
  name: "Pancakes",
  servings: 4,
  tags: ["breakfast", "quick"],
  ingredients: [
    { name: "flour", quantity: 2, unit: "cup" },
    { name: "eggs", quantity: 2, unit: null },
    { name: "milk", quantity: 1.5, unit: "cup", note: "whole" },
  ],
};

describe("recipes API", () => {
  beforeEach(reset);

  it("creates a recipe with structured ingredients and returns the detail", async () => {
    const res = await request(app).post("/api/recipes").send(pancakes);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "Pancakes",
      servings: 4,
      tags: ["breakfast", "quick"],
    });
    expect(res.body.ingredients).toHaveLength(3);
    expect(res.body.ingredients[0]).toMatchObject({ name: "flour", quantity: 2, unit: "cup", position: 0 });
    expect(res.body.ingredients[2]).toMatchObject({ name: "milk", note: "whole" });
  });

  it("lists recipes with an ingredient count, sorted by name", async () => {
    await request(app).post("/api/recipes").send({ ...pancakes, name: "Zucchini Bread" });
    await request(app).post("/api/recipes").send({ ...pancakes, name: "Apple Pie" });

    const res = await request(app).get("/api/recipes");
    expect(res.status).toBe(200);
    expect(res.body.map((r: { name: string }) => r.name)).toEqual(["Apple Pie", "Zucchini Bread"]);
    expect(res.body[0]).toMatchObject({ ingredientCount: 3, tags: ["breakfast", "quick"] });
    expect(res.body[0].ingredients).toBeUndefined();
  });

  it("reads one recipe and 404s for a missing id", async () => {
    const created = await request(app).post("/api/recipes").send(pancakes);
    const ok = await request(app).get(`/api/recipes/${created.body.id}`);
    expect(ok.status).toBe(200);
    expect(ok.body.name).toBe("Pancakes");

    expect((await request(app).get("/api/recipes/99999")).status).toBe(404);
  });

  it("updates a recipe, replacing its ingredient rows", async () => {
    const created = await request(app).post("/api/recipes").send(pancakes);
    const res = await request(app)
      .put(`/api/recipes/${created.body.id}`)
      .send({ name: "Better Pancakes", ingredients: [{ name: "flour", quantity: 3, unit: "cup" }] });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Better Pancakes");
    expect(res.body.ingredients).toEqual([
      expect.objectContaining({ name: "flour", quantity: 3, unit: "cup", position: 0 }),
    ]);
  });

  it("404s when updating a missing recipe", async () => {
    const res = await request(app)
      .put("/api/recipes/99999")
      .send({ name: "x", ingredients: [{ name: "y" }] });
    expect(res.status).toBe(404);
  });

  it("deletes a recipe and cascades its ingredients", async () => {
    const created = await request(app).post("/api/recipes").send(pancakes);
    const id = created.body.id;

    expect((await request(app).delete(`/api/recipes/${id}`)).status).toBe(204);
    expect((await request(app).get(`/api/recipes/${id}`)).status).toBe(404);
    expect(
      db.prepare("SELECT count(*) AS n FROM ingredients WHERE recipe_id = ?").get(id),
    ).toEqual({ n: 0 });

    expect((await request(app).delete(`/api/recipes/${id}`)).status).toBe(404);
  });

  it("rejects a recipe with no name or no ingredients", async () => {
    expect((await request(app).post("/api/recipes").send({ ingredients: [{ name: "salt" }] })).status).toBe(400);
    expect((await request(app).post("/api/recipes").send({ name: "Empty", ingredients: [] })).status).toBe(400);
    expect(
      (await request(app).post("/api/recipes").send({ name: "Blank row", ingredients: [{ name: "  " }] })).status,
    ).toBe(400);
  });
});
