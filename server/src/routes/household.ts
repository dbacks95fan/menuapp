// ABOUTME: /api/household — the single household settings row (name, chosen
// ABOUTME: Fry's store, Fry's connection status). No accounts; LAN-only.
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index.js";

export const householdRouter = Router();

interface HouseholdRow {
  id: number;
  name: string;
  frys_location_id: string | null;
  frys_location_name: string | null;
  kroger_tokens_enc: string | null;
  kroger_connected_at: string | null;
  updated_at: string;
}

function currentHousehold() {
  const row = db.prepare("SELECT * FROM household WHERE id = 1").get() as unknown as HouseholdRow;
  return {
    id: row.id,
    name: row.name,
    frysLocationId: row.frys_location_id,
    frysLocationName: row.frys_location_name,
    frysConnected: row.kroger_tokens_enc != null,
    frysConnectedAt: row.kroger_connected_at,
    updatedAt: row.updated_at,
  };
}

const UpdateHousehold = z.object({ name: z.string().trim().min(1, "name is required") });

householdRouter.get("/api/household", (_req, res) => {
  res.json(currentHousehold());
});

householdRouter.put("/api/household", (req, res) => {
  const parsed = UpdateHousehold.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request body" });
    return;
  }
  db.prepare("UPDATE household SET name = ?, updated_at = datetime('now') WHERE id = 1").run(
    parsed.data.name,
  );
  res.json(currentHousehold());
});
