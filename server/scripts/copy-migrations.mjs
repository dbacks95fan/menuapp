// ABOUTME: Post-tsc build step — copies src/db/migrations/*.sql into dist/,
// ABOUTME: since tsc only emits .js and the migration runner reads .sql at runtime.
import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const from = join(serverRoot, "src", "db", "migrations");
const to = join(serverRoot, "dist", "db", "migrations");

mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
console.log(`copy-migrations: ${from} -> ${to}`);
