// ABOUTME: Tests for the one-off startup shim that renames a pre-MealFlow
// ABOUTME: menuapp.db (and its SQLite sidecar files) to the configured path.
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migrateLegacyDatabase } from "./migrate-legacy-db.js";

describe("migrateLegacyDatabase", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "mealflow-legacy-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("renames a legacy menuapp.db and its WAL/SHM sidecars, preserving contents", () => {
    const legacy = join(dir, "menuapp.db");
    const target = join(dir, "mealflow.db");
    writeFileSync(legacy, "main-db-bytes");
    writeFileSync(`${legacy}-wal`, "wal-bytes");
    writeFileSync(`${legacy}-shm`, "shm-bytes");

    migrateLegacyDatabase(target);

    expect(existsSync(legacy)).toBe(false);
    expect(existsSync(`${legacy}-wal`)).toBe(false);
    expect(readFileSync(target, "utf8")).toBe("main-db-bytes");
    expect(readFileSync(`${target}-wal`, "utf8")).toBe("wal-bytes");
    expect(readFileSync(`${target}-shm`, "utf8")).toBe("shm-bytes");
  });

  it("is a no-op when the target database already exists", () => {
    const legacy = join(dir, "menuapp.db");
    const target = join(dir, "mealflow.db");
    writeFileSync(legacy, "old-bytes");
    writeFileSync(target, "current-bytes");

    migrateLegacyDatabase(target);

    expect(readFileSync(target, "utf8")).toBe("current-bytes");
    expect(existsSync(legacy)).toBe(true);
  });

  it("is a no-op when there is no legacy database", () => {
    const target = join(dir, "mealflow.db");

    expect(() => migrateLegacyDatabase(target)).not.toThrow();
    expect(existsSync(target)).toBe(false);
  });

  it("is a no-op when the target path is itself the legacy filename", () => {
    const target = join(dir, "menuapp.db");
    writeFileSync(target, "unchanged");

    migrateLegacyDatabase(target);

    expect(readFileSync(target, "utf8")).toBe("unchanged");
  });

  it("does nothing for an in-memory database", () => {
    expect(() => migrateLegacyDatabase(":memory:")).not.toThrow();
  });
});
