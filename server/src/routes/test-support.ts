// ABOUTME: A data-reset endpoint for end-to-end tests. Only mounted when
// ABOUTME: MEALFLOW_ENABLE_TEST_RESET=1; never in a normal deployment.
import { Router } from "express";
import { db } from "../db/index.js";

export const testSupportEnabled = process.env.MEALFLOW_ENABLE_TEST_RESET === "1";

export const testSupportRouter = Router();

testSupportRouter.post("/api/test/reset", (_req, res) => {
  db.exec(`
    DELETE FROM meal_selections;
    DELETE FROM pantry_items;
    DELETE FROM ingredient_product_map;
    DELETE FROM ingredients;
    DELETE FROM recipes;
    UPDATE household
      SET name = 'Our Household', frys_location_id = NULL, frys_location_name = NULL,
          kroger_tokens_enc = NULL, kroger_connected_at = NULL
      WHERE id = 1;
  `);
  res.status(204).end();
});
