// ABOUTME: Runs a function inside a SQLite transaction, committing on success
// ABOUTME: and rolling back if it throws. node:sqlite has no transaction helper.
import type { DatabaseSync as DatabaseSyncType } from "node:sqlite";

type Db = InstanceType<typeof DatabaseSyncType>;

export function transaction<T>(db: Db, fn: () => T): T {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
