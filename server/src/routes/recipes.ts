// ABOUTME: /api/recipes — list all recipes and create a recipe (name + ingredient
// ABOUTME: strings). Request bodies are validated with zod.
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index.js";

export const recipesRouter = Router();

const CreateRecipe = z.object({
  name: z.string().trim().min(1, "name is required"),
  ingredients: z.array(z.string()),
});

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
  const parsed = CreateRecipe.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request body" });
    return;
  }

  const { name, ingredients } = parsed.data;
  const result = db
    .prepare("INSERT INTO recipes (name, ingredients) VALUES (?, ?)")
    .run(name, JSON.stringify(ingredients));

  const row = db.prepare("SELECT * FROM recipes WHERE id = ?").get(result.lastInsertRowid) as unknown as RecipeRow;
  res.status(201).json(toRecipe(row));
});
