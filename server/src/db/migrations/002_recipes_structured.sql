-- 002_recipes_structured: move ingredients into their own normalized table,
-- add recipe metadata (servings, tags, updated_at), and create the single
-- household settings row.

CREATE TABLE IF NOT EXISTS household (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT 'Our Household',
  frys_location_id TEXT,
  frys_location_name TEXT,
  kroger_tokens_enc TEXT,
  kroger_connected_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO household (id) VALUES (1);

-- ADD COLUMN defaults must be constant, so updated_at is backfilled below.
ALTER TABLE recipes ADD COLUMN servings INTEGER;
ALTER TABLE recipes ADD COLUMN tags TEXT NOT NULL DEFAULT '';
ALTER TABLE recipes ADD COLUMN updated_at TEXT;
UPDATE recipes SET updated_at = COALESCE(created_at, datetime('now'));

CREATE TABLE ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  quantity REAL,
  unit TEXT,
  note TEXT,
  raw_text TEXT
);
CREATE INDEX idx_ingredients_recipe ON ingredients(recipe_id);

-- Carry existing JSON-array ingredient strings across as name-only rows; the
-- legacy data had no structure to preserve. json_each ships with SQLite.
INSERT INTO ingredients (recipe_id, position, name, raw_text)
SELECT r.id, je.key, je.value, je.value
FROM recipes r, json_each(r.ingredients) je
WHERE json_valid(r.ingredients);

ALTER TABLE recipes DROP COLUMN ingredients;
