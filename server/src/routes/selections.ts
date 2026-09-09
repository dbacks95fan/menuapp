// ABOUTME: /api/selections — the household's shared "this week" recipe list.
// ABOUTME: Selection is idempotent; no dates or days.
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index.js";

export const selectionsRouter = Router();

interface SelectionRow {
  recipe_id: number;
  name: string;
  servings: number | null;
  added_at: string;
  ingredient_count: number;
}

function listSelections() {
  const rows = db
    .prepare(
      `SELECT s.recipe_id, r.name, r.servings, s.added_at,
              (SELECT count(*) FROM ingredients i WHERE i.recipe_id = r.id) AS ingredient_count
       FROM meal_selections s
       JOIN recipes r ON r.id = s.recipe_id
       ORDER BY r.name COLLATE NOCASE`,
    )
    .all() as unknown as SelectionRow[];
  return rows.map((row) => ({
    recipeId: row.recipe_id,
    name: row.name,
    servings: row.servings,
    ingredientCount: row.ingredient_count,
    addedAt: row.added_at,
  }));
}

selectionsRouter.get("/api/selections", (_req, res) => {
  res.json(listSelections());
});

const AddSelection = z.object({ recipeId: z.number().int().positive() });

selectionsRouter.post("/api/selections", (req, res) => {
  const parsed = AddSelection.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "recipeId (number) is required" });
    return;
  }
  const recipe = db.prepare("SELECT 1 FROM recipes WHERE id = ?").get(parsed.data.recipeId);
  if (!recipe) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  db.prepare("INSERT OR IGNORE INTO meal_selections (recipe_id) VALUES (?)").run(parsed.data.recipeId);
  res.status(201).json(listSelections());
});

selectionsRouter.delete("/api/selections/:recipeId", (req, res) => {
  const result = db
    .prepare("DELETE FROM meal_selections WHERE recipe_id = ?")
    .run(Number(req.params.recipeId));
  if (result.changes === 0) {
    res.status(404).json({ error: "Recipe is not in the weekly selection" });
    return;
  }
  res.json(listSelections());
});

selectionsRouter.delete("/api/selections", (_req, res) => {
  db.prepare("DELETE FROM meal_selections").run();
  res.status(204).end();
});
