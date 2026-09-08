-- 003_meal_selections: the household's shared "this week" recipe list.
-- No dates or days; one row per recipe (idempotent selection).

CREATE TABLE meal_selections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL UNIQUE REFERENCES recipes(id) ON DELETE CASCADE,
  added_at TEXT NOT NULL DEFAULT (datetime('now'))
);
