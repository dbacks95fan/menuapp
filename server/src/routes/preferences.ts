// ABOUTME: /api/preferences — list all key/value preferences and upsert one by
// ABOUTME: key. Request bodies are validated with zod.
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index.js";

export const preferencesRouter = Router();

const SetPreference = z.object({ value: z.string() });

interface PreferenceRow {
  key: string;
  value: string;
  updated_at: string;
}

preferencesRouter.get("/api/preferences", (_req, res) => {
  const rows = db.prepare("SELECT * FROM preferences ORDER BY key").all() as unknown as PreferenceRow[];
  res.json(rows);
});

preferencesRouter.put("/api/preferences/:key", (req, res) => {
  const parsed = SetPreference.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "value (string) is required" });
    return;
  }

  db.prepare(
    `INSERT INTO preferences (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(req.params.key, parsed.data.value);

  const row = db.prepare("SELECT * FROM preferences WHERE key = ?").get(req.params.key) as unknown as PreferenceRow;
  res.json(row);
});
