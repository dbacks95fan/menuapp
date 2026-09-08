import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { db } from "../db/index.js";

const app = createApp();

describe("frys API (no credentials configured)", () => {
  beforeEach(() => {
    db.exec(
      "DELETE FROM ingredient_product_map; DELETE FROM meal_selections; DELETE FROM ingredients; DELETE FROM recipes; " +
        "UPDATE household SET kroger_tokens_enc = NULL, frys_location_id = NULL, frys_location_name = NULL WHERE id = 1;",
    );
  });

  it("reports not configured and not connected", async () => {
    const res = await request(app).get("/api/frys/status");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ configured: false, connected: false, locationId: null });
  });

  it("refuses to produce an authorize URL when unconfigured", async () => {
    expect((await request(app).get("/api/frys/authorize-url")).status).toBe(409);
  });

  it("sends a bad OAuth callback back to settings with an error", async () => {
    const res = await request(app).get("/api/frys/callback?code=x&state=never-issued");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/settings?frys=error");
  });

  it("requires a connected account before matching or cart", async () => {
    expect((await request(app).get("/api/frys/match")).status).toBe(409);
    expect(
      (await request(app).post("/api/frys/cart").send({ items: [{ upc: "1", quantity: 1, name: "x" }] })).status,
    ).toBe(409);
  });

  it("saves the chosen store", async () => {
    const res = await request(app)
      .put("/api/frys/location")
      .send({ locationId: "70100460", name: "Fry's Central" });
    expect(res.status).toBe(200);
    expect((await request(app).get("/api/frys/status")).body).toMatchObject({
      locationId: "70100460",
      locationName: "Fry's Central",
    });
  });

  it("remembers a product choice for an ingredient", async () => {
    const res = await request(app)
      .put("/api/frys/match/penne")
      .send({ productId: "0001", upc: "0001111", brand: "Barilla", size: "16 oz", description: "Barilla Penne" });
    expect(res.status).toBe(200);

    const row = db.prepare("SELECT * FROM ingredient_product_map WHERE normalized_name = 'penne'").get();
    expect(row).toMatchObject({ kroger_product_id: "0001", brand: "Barilla", size: "16 oz" });
  });
});
