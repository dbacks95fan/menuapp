import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { db } from "../db/index.js";

const app = createApp();

describe("pantry API", () => {
  beforeEach(() => {
    db.exec("DELETE FROM pantry_items;");
  });

  it("adds items and de-duplicates by normalized name", async () => {
    await request(app).post("/api/pantry").send({ name: "Tomatoes" });
    const res = await request(app).post("/api/pantry").send({ name: "tomato" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ name: "Tomatoes", normalizedName: "tomato" });
  });

  it("rejects a blank name", async () => {
    expect((await request(app).post("/api/pantry").send({ name: "  " })).status).toBe(400);
  });

  it("removes an item and 404s for an unknown id", async () => {
    const added = await request(app).post("/api/pantry").send({ name: "Salt" });
    const id = added.body[0].id;
    expect((await request(app).delete(`/api/pantry/${id}`)).status).toBe(200);
    expect((await request(app).delete(`/api/pantry/${id}`)).status).toBe(404);
  });
});
