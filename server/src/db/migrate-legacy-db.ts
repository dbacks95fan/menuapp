// ABOUTME: One-off startup shim: renames a pre-MealFlow menuapp.db (and its
// ABOUTME: -wal/-shm/-journal sidecars) to the configured database path so
// ABOUTME: household data survives the rename. Idempotent; safe to call always.
import { existsSync, renameSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const LEGACY_FILENAME = "menuapp.db";
const SIDECAR_SUFFIXES = ["", "-wal", "-shm", "-journal"];

/**
 * If `targetPath` does not yet exist but a legacy `menuapp.db` sits beside it,
 * move the legacy database and its SQLite sidecar files to `targetPath`.
 * No-op for in-memory databases, when the target already exists, when the
 * target *is* the legacy file, or when there is nothing to migrate.
 */
export function migrateLegacyDatabase(targetPath: string): void {
  if (targetPath === ":memory:") return;

  const legacyPath = join(dirname(targetPath), LEGACY_FILENAME);
  if (legacyPath === targetPath) return;
  if (basename(targetPath) === LEGACY_FILENAME) return;
  if (existsSync(targetPath)) return;
  if (!existsSync(legacyPath)) return;

  for (const suffix of SIDECAR_SUFFIXES) {
    const from = `${legacyPath}${suffix}`;
    if (existsSync(from)) {
      renameSync(from, `${targetPath}${suffix}`);
    }
  }
  console.log(`mealflow-server: migrated legacy database ${legacyPath} -> ${targetPath}`);
}
