// ABOUTME: Tests for the SQL migration runner: ordered, once-only application
// ABOUTME: of ./migrations/*.sql files tracked in schema_migrations.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DatabaseSync as DatabaseSyncType } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runMigrations } from "./migrate.js";

const { DatabaseSync } = process.getBuiltinModule("node:sqlite") as {
  DatabaseSync: typeof DatabaseSyncType;
};

function tableNames(db: InstanceType<typeof DatabaseSyncType>): string[] {
  return (
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]
  ).map((r) => r.name);
}

describe("runMigrations", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "mealflow-migrate-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("applies pending migrations in filename order and records them", () => {
    writeFileSync(join(dir, "001_a.sql"), "CREATE TABLE foo (id INTEGER PRIMARY KEY);");
    writeFileSync(join(dir, "002_b.sql"), "CREATE TABLE bar (id INTEGER PRIMARY KEY);");
    const db = new DatabaseSync(":memory:");

    const ran = runMigrations(db, dir);

    expect(ran).toEqual(["001_a.sql", "002_b.sql"]);
    expect(tableNames(db)).toEqual(expect.arrayContaining(["foo", "bar", "schema_migrations"]));
    const versions = (
      db.prepare("SELECT version FROM schema_migrations ORDER BY version").all() as { version: string }[]
    ).map((r) => r.version);
    expect(versions).toEqual(["001_a.sql", "002_b.sql"]);
  });

  it("is a no-op on a second run", () => {
    writeFileSync(join(dir, "001_a.sql"), "CREATE TABLE foo (id INTEGER PRIMARY KEY);");
    const db = new DatabaseSync(":memory:");
    runMigrations(db, dir);

    expect(runMigrations(db, dir)).toEqual([]);
  });

  it("applies only newly added migrations on a later run", () => {
    writeFileSync(join(dir, "001_a.sql"), "CREATE TABLE foo (id INTEGER PRIMARY KEY);");
    const db = new DatabaseSync(":memory:");
    runMigrations(db, dir);

    writeFileSync(join(dir, "002_b.sql"), "CREATE TABLE bar (id INTEGER PRIMARY KEY);");
    expect(runMigrations(db, dir)).toEqual(["002_b.sql"]);
    expect(tableNames(db)).toEqual(expect.arrayContaining(["foo", "bar"]));
  });

  it("rolls back and reports the file when a migration fails", () => {
    writeFileSync(join(dir, "001_bad.sql"), "CREATE TABLE ok (id INTEGER); THIS IS NOT SQL;");
    const db = new DatabaseSync(":memory:");

    expect(() => runMigrations(db, dir)).toThrow(/001_bad\.sql/);
    expect(tableNames(db)).not.toContain("ok");
    expect(
      db.prepare("SELECT count(*) AS n FROM schema_migrations").get() as { n: number },
    ).toEqual({ n: 0 });
  });

  it("applies the real bundled migrations to a fresh database", () => {
    const db = new DatabaseSync(":memory:");

    runMigrations(db);

    expect(tableNames(db)).toEqual(
      expect.arrayContaining([
        "recipes",
        "preferences",
        "ingredients",
        "household",
        "schema_migrations",
      ]),
    );
    expect(db.prepare("SELECT id FROM household").all()).toEqual([{ id: 1 }]);
  });

  it("carries legacy JSON-array ingredients into the ingredients table (002)", () => {
    const db = new DatabaseSync(":memory:");
    // Simulate a pre-002 database: apply only the baseline schema.
    db.exec(
      "CREATE TABLE recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, " +
        "ingredients TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
    );
    db.exec(
      "CREATE TABLE schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))",
    );
    db.exec("INSERT INTO schema_migrations (version) VALUES ('001_init.sql')");
    db.prepare("INSERT INTO recipes (name, ingredients) VALUES (?, ?)").run(
      "Legacy Pancakes",
      JSON.stringify(["2 cups flour", "2 eggs", "milk"]),
    );

    runMigrations(db);

    const rows = db
      .prepare(
        "SELECT i.name, i.position FROM ingredients i JOIN recipes r ON r.id = i.recipe_id " +
          "WHERE r.name = 'Legacy Pancakes' ORDER BY i.position",
      )
      .all();
    expect(rows).toEqual([
      { name: "2 cups flour", position: 0 },
      { name: "2 eggs", position: 1 },
      { name: "milk", position: 2 },
    ]);
    // Old column is gone.
    expect(() => db.exec("SELECT ingredients FROM recipes")).toThrow();
  });
});
