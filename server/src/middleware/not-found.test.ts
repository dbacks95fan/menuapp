// ABOUTME: Tests the /api 404 handler returns JSON, not the SPA HTML fallback.
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { notFoundHandler } from "./not-found.js";

function app() {
  const a = express();
  a.get("/api/known", (_req, res) => res.json({ ok: true }));
  a.use("/api", notFoundHandler);
  return a;
}

describe("notFoundHandler", () => {
  it("returns a 404 JSON body for an unknown /api route", async () => {
    const res = await request(app()).get("/api/unknown");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
  });

  it("does not shadow a known route", async () => {
    const res = await request(app()).get("/api/known");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
