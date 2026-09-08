-- 004_pantry: staples the household keeps on hand, so the grocery list can
-- offer to hide them. The combined list still includes everything.

CREATE TABLE pantry_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
