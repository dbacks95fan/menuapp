import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

const app = createApp();

describe("import API", () => {
  it("turns pasted text into a draft without saving it", async () => {
    const text = ["My Salad", "Ingredients", "2 cups spinach", "1/2 cup walnuts"].join("\n");
    const res = await request(app).post("/api/import/text").send({ text });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("My Salad");
    expect(res.body.ingredients).toEqual([
      expect.objectContaining({ name: "spinach", quantity: 2, unit: "cup" }),
      expect.objectContaining({ name: "walnuts", quantity: 0.5, unit: "cup" }),
    ]);
    // nothing persisted
    expect((await request(app).get("/api/recipes")).body).toEqual([]);
  });

  it("rejects empty text", async () => {
    expect((await request(app).post("/api/import/text").send({ text: "  " })).status).toBe(400);
  });

  it("rejects an invalid url and refuses private targets", async () => {
    expect((await request(app).post("/api/import/url").send({ url: "not a url" })).status).toBe(400);
    const res = await request(app).post("/api/import/url").send({ url: "http://localhost:9999/x" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not allowed/i);
  });
});
