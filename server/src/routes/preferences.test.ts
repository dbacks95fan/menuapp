import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("preferences API", () => {
  it("sets and retrieves a preference", async () => {
    const app = createApp();

    const put = await request(app)
      .put("/api/preferences/milk-brand")
      .send({ value: "Oat Milk Co" });

    expect(put.status).toBe(200);
    expect(put.body).toMatchObject({ key: "milk-brand", value: "Oat Milk Co" });

    const list = await request(app).get("/api/preferences");
    expect(list.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "milk-brand", value: "Oat Milk Co" })]),
    );
  });

  it("rejects a preference with a missing or non-string value", async () => {
    const app = createApp();
    expect((await request(app).put("/api/preferences/x").send({})).status).toBe(400);
    expect((await request(app).put("/api/preferences/x").send({ value: 42 })).status).toBe(400);
  });
});
