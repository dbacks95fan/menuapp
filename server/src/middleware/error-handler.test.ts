// ABOUTME: Tests the terminal error handler: status mapping and that internal
// ABOUTME: details never reach the client.
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { errorHandler } from "./error-handler.js";

function app(thrown: unknown) {
  const a = express();
  a.get("/boom", () => {
    throw thrown;
  });
  a.use(errorHandler);
  return a;
}

describe("errorHandler", () => {
  it("maps a bare error to a generic 500 with no internal message", async () => {
    const res = await request(app(new Error("connection string leaked here"))).get("/boom");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
    expect(JSON.stringify(res.body)).not.toContain("leaked");
  });

  it("passes through a client-error status and message", async () => {
    const err = Object.assign(new Error("name is required"), { status: 400 });
    const res = await request(app(err)).get("/boom");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "name is required" });
  });

  it("honours statusCode as well as status", async () => {
    const err = Object.assign(new Error("gone"), { statusCode: 410 });
    const res = await request(app(err)).get("/boom");
    expect(res.status).toBe(410);
    expect(res.body).toEqual({ error: "gone" });
  });
});
