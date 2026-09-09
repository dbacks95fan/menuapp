-- 005_ingredient_product_map: the household's remembered Fry's product choice
-- for an ingredient, so a brand picked once is reused for every later recipe.

CREATE TABLE ingredient_product_map (
  normalized_name TEXT PRIMARY KEY,
  kroger_product_id TEXT NOT NULL,
  upc TEXT,
  brand TEXT,
  size TEXT,
  description TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
