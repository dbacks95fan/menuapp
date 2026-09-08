import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("recipes API", () => {
  it("creates and lists recipes", async () => {
    const app = createApp();

    const created = await request(app)
      .post("/api/recipes")
      .send({ name: "Pancakes", ingredients: ["flour", "eggs", "milk"] });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      name: "Pancakes",
      ingredients: ["flour", "eggs", "milk"],
    });

    const listed = await request(app).get("/api/recipes");
    expect(listed.status).toBe(200);
    expect(listed.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Pancakes" })]),
    );
  });

  it("rejects a recipe without a name", async () => {
    const app = createApp();
    const res = await request(app).post("/api/recipes").send({ ingredients: ["salt"] });
    expect(res.status).toBe(400);
  });

  it("rejects a whitespace-only name", async () => {
    const res = await request(createApp())
      .post("/api/recipes")
      .send({ name: "   ", ingredients: [] });
    expect(res.status).toBe(400);
  });

  it("rejects ingredients that are not an array of strings", async () => {
    const res = await request(createApp())
      .post("/api/recipes")
      .send({ name: "Soup", ingredients: [1, 2, 3] });
    expect(res.status).toBe(400);
  });

  it("trims the stored recipe name", async () => {
    const res = await request(createApp())
      .post("/api/recipes")
      .send({ name: "  Waffles  ", ingredients: ["flour"] });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Waffles");
  });
});
