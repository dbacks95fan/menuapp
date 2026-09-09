// ABOUTME: /api/grocery-list — the combined ingredient list for the week's
// ABOUTME: selected recipes, with a pantry flag per line (the list itself never
// ABOUTME: drops anything).
import { Router } from "express";
import { db } from "../db/index.js";
import { buildGroceryList, type GroceryInput } from "../lib/grocery-list.js";

export const groceryListRouter = Router();

interface Row {
  recipe_id: number;
  recipe_name: string;
  name: string;
  quantity: number | null;
  unit: string | null;
}

groceryListRouter.get("/api/grocery-list", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT s.recipe_id, r.name AS recipe_name, i.name, i.quantity, i.unit
       FROM meal_selections s
       JOIN recipes r ON r.id = s.recipe_id
       JOIN ingredients i ON i.recipe_id = s.recipe_id
       ORDER BY i.position, i.id`,
    )
    .all() as unknown as Row[];

  const inputs: GroceryInput[] = rows.map((row) => ({
    recipeId: row.recipe_id,
    recipeName: row.recipe_name,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
  }));

  const pantry = new Set(
    (db.prepare("SELECT normalized_name FROM pantry_items").all() as { normalized_name: string }[]).map(
      (p) => p.normalized_name,
    ),
  );

  const lines = buildGroceryList(inputs).map((line) => ({
    ...line,
    inPantry: pantry.has(line.normalizedName),
  }));

  res.json({ lines, recipeCount: new Set(inputs.map((i) => i.recipeId)).size });
});
