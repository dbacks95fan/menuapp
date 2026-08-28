import { Router } from "express";
import { db } from "../db/index.js";

export const recipesRouter = Router();

interface RecipeRow {
  id: number;
  name: string;
  ingredients: string;
  created_at: string;
}

function toRecipe(row: RecipeRow) {
  return {
    id: row.id,
    name: row.name,
    ingredients: JSON.parse(row.ingredients) as string[],
    createdAt: row.created_at,
  };
}

recipesRouter.get("/api/recipes", (_req, res) => {
  const rows = db.prepare("SELECT * FROM recipes ORDER BY created_at DESC").all() as unknown as RecipeRow[];
  res.json(rows.map(toRecipe));
});

recipesRouter.post("/api/recipes", (req, res) => {
  const { name, ingredients } = req.body ?? {};
  if (typeof name !== "string" || name.trim() === "" || !Array.isArray(ingredients)) {
    res.status(400).json({ error: "name (string) and ingredients (string[]) are required" });
    return;
  }

  const result = db
    .prepare("INSERT INTO recipes (name, ingredients) VALUES (?, ?)")
    .run(name.trim(), JSON.stringify(ingredients));

  const row = db.prepare("SELECT * FROM recipes WHERE id = ?").get(result.lastInsertRowid) as unknown as RecipeRow;
  res.status(201).json(toRecipe(row));
});
