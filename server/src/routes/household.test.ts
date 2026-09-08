import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

const app = createApp();

describe("household API", () => {
  it("returns the seeded household with Fry's disconnected", async () => {
    const res = await request(app).get("/api/household");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, frysConnected: false });
    expect(typeof res.body.name).toBe("string");
  });

  it("renames the household", async () => {
    const res = await request(app).put("/api/household").send({ name: "The Testers" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("The Testers");

    const after = await request(app).get("/api/household");
    expect(after.body.name).toBe("The Testers");
  });

  it("rejects a blank household name", async () => {
    expect((await request(app).put("/api/household").send({ name: "  " })).status).toBe(400);
  });
});
