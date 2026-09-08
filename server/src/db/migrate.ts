// ABOUTME: SQL migration runner. Applies ./migrations/*.sql in filename order
// ABOUTME: exactly once each, inside a transaction, tracked in schema_migrations.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { DatabaseSync as DatabaseSyncType } from "node:sqlite";

type Db = InstanceType<typeof DatabaseSyncType>;

const bundledMigrationsDir = join(dirname(fileURLToPath(import.meta.url)), "migrations");

/**
 * Ensure `schema_migrations` exists, then apply every `*.sql` file in `dir` that
 * has not been applied yet, ordered by filename. Each file runs in its own
 * transaction; a failure rolls that file back and throws, naming the file.
 * Returns the list of files applied by this call (empty when already current).
 */
export function runMigrations(db: Db, dir: string = bundledMigrationsDir): string[] {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    (db.prepare("SELECT version FROM schema_migrations").all() as { version: string }[]).map(
      (row) => row.version,
    ),
  );

  const pending = readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .filter((file) => !applied.has(file));

  const ran: string[] = [];
  for (const file of pending) {
    const sql = readFileSync(join(dir, file), "utf8");
    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (version) VALUES (?)").run(file);
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw new Error(`migration ${file} failed: ${(err as Error).message}`);
    }
    ran.push(file);
  }
  return ran;
}
