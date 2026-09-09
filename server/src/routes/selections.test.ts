import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { db } from "../db/index.js";

const app = createApp();

async function makeRecipe(name: string): Promise<number> {
  const res = await request(app)
    .post("/api/recipes")
    .send({ name, ingredients: [{ name: "thing" }] });
  return res.body.id as number;
}

describe("selections API", () => {
  beforeEach(() => {
    db.exec("DELETE FROM meal_selections; DELETE FROM ingredients; DELETE FROM recipes;");
  });

  it("adds a recipe to the week, ignoring duplicates", async () => {
    const id = await makeRecipe("Chili");

    const first = await request(app).post("/api/selections").send({ recipeId: id });
    expect(first.status).toBe(201);
    expect(first.body).toHaveLength(1);

    const again = await request(app).post("/api/selections").send({ recipeId: id });
    expect(again.status).toBe(201);
    expect(again.body).toHaveLength(1); // no duplicate
  });

  it("404s when selecting a recipe that does not exist", async () => {
    expect((await request(app).post("/api/selections").send({ recipeId: 4242 })).status).toBe(404);
  });

  it("lists selected recipes with an ingredient count", async () => {
    const id = await makeRecipe("Soup");
    await request(app).post("/api/selections").send({ recipeId: id });

    const res = await request(app).get("/api/selections");
    expect(res.body).toEqual([
      expect.objectContaining({ recipeId: id, name: "Soup", ingredientCount: 1 }),
    ]);
  });

  it("removes one selection and clears them all", async () => {
    const a = await makeRecipe("A");
    const b = await makeRecipe("B");
    await request(app).post("/api/selections").send({ recipeId: a });
    await request(app).post("/api/selections").send({ recipeId: b });

    const removed = await request(app).delete(`/api/selections/${a}`);
    expect(removed.status).toBe(200);
    expect(removed.body).toHaveLength(1);

    expect((await request(app).delete(`/api/selections/${a}`)).status).toBe(404);

    expect((await request(app).delete("/api/selections")).status).toBe(204);
    expect((await request(app).get("/api/selections")).body).toEqual([]);
  });

  it("drops the selection when its recipe is deleted", async () => {
    const id = await makeRecipe("Doomed");
    await request(app).post("/api/selections").send({ recipeId: id });

    await request(app).delete(`/api/recipes/${id}`);

    expect((await request(app).get("/api/selections")).body).toEqual([]);
  });
});
