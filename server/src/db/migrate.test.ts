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
      expect.arrayContaining(["recipes", "preferences", "schema_migrations"]),
    );
  });
});
