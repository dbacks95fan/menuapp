// ABOUTME: /api/recipes — list, read, create, edit, and delete household
// ABOUTME: recipes with structured ingredient rows. Bodies validated with zod.
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index.js";
import { transaction } from "../db/tx.js";
import { normalizeUnit } from "../lib/units.js";

export const recipesRouter = Router();

const IngredientInput = z.object({
  name: z.string().trim().min(1),
  quantity: z.number().positive().nullable().optional(),
  unit: z.string().trim().min(1).nullable().optional(),
  note: z.string().trim().min(1).nullable().optional(),
  raw: z.string().optional(),
});

const RecipeInput = z.object({
  name: z.string().trim().min(1, "name is required"),
  servings: z.number().int().positive().nullable().optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  ingredients: z.array(IngredientInput).min(1, "at least one ingredient is required"),
});

function normalizeTags(tags: string[] | string | undefined): string {
  const list = Array.isArray(tags) ? tags : (tags ?? "").split(",");
  return list.map((t) => t.trim()).filter(Boolean).join(",");
}

function splitTags(stored: string): string[] {
  return stored ? stored.split(",").filter(Boolean) : [];
}

interface RecipeRow {
  id: number;
  name: string;
  servings: number | null;
  tags: string;
  created_at: string;
  updated_at: string;
}

interface IngredientRow {
  id: number;
  position: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  raw_text: string | null;
}

function getRecipeDetail(id: number) {
  const recipe = db.prepare("SELECT * FROM recipes WHERE id = ?").get(id) as RecipeRow | undefined;
  if (!recipe) return undefined;
  const ingredients = db
    .prepare("SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY position, id")
    .all(id) as unknown as IngredientRow[];
  return {
    id: recipe.id,
    name: recipe.name,
    servings: recipe.servings,
    tags: splitTags(recipe.tags),
    ingredients: ingredients.map((row) => ({
      id: row.id,
      position: row.position,
      name: row.name,
      quantity: row.quantity,
      unit: row.unit,
      note: row.note,
      raw: row.raw_text,
    })),
    createdAt: recipe.created_at,
    updatedAt: recipe.updated_at,
  };
}

function writeIngredients(recipeId: number, ingredients: z.infer<typeof IngredientInput>[]) {
  const insert = db.prepare(
    "INSERT INTO ingredients (recipe_id, position, name, quantity, unit, note, raw_text) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  ingredients.forEach((ing, position) => {
    insert.run(
      recipeId,
      position,
      ing.name,
      ing.quantity ?? null,
      normalizeUnit(ing.unit) ?? null,
      ing.note ?? null,
      ing.raw ?? null,
    );
  });
}

recipesRouter.get("/api/recipes", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT r.id, r.name, r.servings, r.tags, r.created_at, r.updated_at,
              (SELECT count(*) FROM ingredients i WHERE i.recipe_id = r.id) AS ingredient_count
       FROM recipes r
       ORDER BY r.name COLLATE NOCASE`,
    )
    .all() as unknown as (RecipeRow & { ingredient_count: number })[];
  res.json(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      servings: row.servings,
      tags: splitTags(row.tags),
      ingredientCount: row.ingredient_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  );
});

recipesRouter.get("/api/recipes/:id", (req, res) => {
  const detail = getRecipeDetail(Number(req.params.id));
  if (!detail) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  res.json(detail);
});

recipesRouter.post("/api/recipes", (req, res) => {
  const parsed = RecipeInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request body" });
    return;
  }
  const { name, servings, tags, ingredients } = parsed.data;

  const id = transaction(db, () => {
    const result = db
      .prepare(
        "INSERT INTO recipes (name, servings, tags, updated_at) VALUES (?, ?, ?, datetime('now'))",
      )
      .run(name, servings ?? null, normalizeTags(tags));
    const recipeId = Number(result.lastInsertRowid);
    writeIngredients(recipeId, ingredients);
    return recipeId;
  });

  res.status(201).json(getRecipeDetail(id));
});

recipesRouter.put("/api/recipes/:id", (req, res) => {
  const id = Number(req.params.id);
  const exists = db.prepare("SELECT 1 FROM recipes WHERE id = ?").get(id);
  if (!exists) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  const parsed = RecipeInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request body" });
    return;
  }
  const { name, servings, tags, ingredients } = parsed.data;

  transaction(db, () => {
    db.prepare(
      "UPDATE recipes SET name = ?, servings = ?, tags = ?, updated_at = datetime('now') WHERE id = ?",
    ).run(name, servings ?? null, normalizeTags(tags), id);
    db.prepare("DELETE FROM ingredients WHERE recipe_id = ?").run(id);
    writeIngredients(id, ingredients);
  });

  res.json(getRecipeDetail(id));
});

recipesRouter.delete("/api/recipes/:id", (req, res) => {
  const result = db.prepare("DELETE FROM recipes WHERE id = ?").run(Number(req.params.id));
  if (result.changes === 0) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  res.status(204).end();
});
