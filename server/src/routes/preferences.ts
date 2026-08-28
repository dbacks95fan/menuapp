import { Router } from "express";
import { db } from "../db/index.js";

export const preferencesRouter = Router();

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
  const { value } = req.body ?? {};
  if (typeof value !== "string") {
    res.status(400).json({ error: "value (string) is required" });
    return;
  }

  db.prepare(
    `INSERT INTO preferences (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(req.params.key, value);

  const row = db.prepare("SELECT * FROM preferences WHERE key = ?").get(req.params.key) as unknown as PreferenceRow;
  res.json(row);
});
