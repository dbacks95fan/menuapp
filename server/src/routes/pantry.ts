// ABOUTME: /api/pantry — staples the household already has. Matched against the
// ABOUTME: grocery list by normalized ingredient name.
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index.js";
import { normalizeIngredientName } from "../lib/normalize-name.js";

export const pantryRouter = Router();

interface PantryRow {
  id: number;
  name: string;
  normalized_name: string;
  created_at: string;
}

function listPantry() {
  const rows = db
    .prepare("SELECT * FROM pantry_items ORDER BY name COLLATE NOCASE")
    .all() as unknown as PantryRow[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    normalizedName: row.normalized_name,
    createdAt: row.created_at,
  }));
}

pantryRouter.get("/api/pantry", (_req, res) => {
  res.json(listPantry());
});

const AddPantryItem = z.object({ name: z.string().trim().min(1, "name is required") });

pantryRouter.post("/api/pantry", (req, res) => {
  const parsed = AddPantryItem.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request body" });
    return;
  }
  const normalized = normalizeIngredientName(parsed.data.name);
  db.prepare(
    "INSERT INTO pantry_items (name, normalized_name) VALUES (?, ?) ON CONFLICT(normalized_name) DO NOTHING",
  ).run(parsed.data.name, normalized);
  res.status(201).json(listPantry());
});

pantryRouter.delete("/api/pantry/:id", (req, res) => {
  const result = db.prepare("DELETE FROM pantry_items WHERE id = ?").run(Number(req.params.id));
  if (result.changes === 0) {
    res.status(404).json({ error: "Pantry item not found" });
    return;
  }
  res.json(listPantry());
});
