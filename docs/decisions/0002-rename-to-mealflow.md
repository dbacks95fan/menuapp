# 0002 — Rename the product to MealFlow

**Status**: Accepted

## Context

The product was scaffolded as "Menu App" / `menuapp`. The durable product name is
**MealFlow** (see `docs/product/overview.md`), and the legacy name still appeared in
user-facing UI, package metadata, the default database filename, container/image
names, tests, and docs. Trello card **INT-MF-0001** captures the rename.

## Decision

- Rename product-identifying strings to **MealFlow**: the client `<title>` and `<h1>`,
  npm package names (`mealflow`, `mealflow-server`, `mealflow-e2e`), the server startup
  log line, `docker-compose.yml` project/image/container names, e2e assertions, and docs.
- **Keep the GitHub repository name `dbacks95fan/menuapp`.** Renaming the remote is out
  of scope and explicitly excluded by INT-MF-0001.
- Change the default SQLite filename from `menuapp.db` to `mealflow.db`, and ship an
  automatic, idempotent persistence migration so existing household data is not lost.
- Historical "formerly Menu App" notes in `CLAUDE.md` and `docs/product/overview.md`
  are intentionally left in place — naming the old name once, as history, is not a
  stale reference.

## Persistence migration

`server/src/db/migrate-legacy-db.ts` (`migrateLegacyDatabase`) runs on startup, before
the database is opened, whenever `SQLITE_PATH` is a real file path:

- If the target file does not exist but a sibling `menuapp.db` does, it renames
  `menuapp.db` and its `-wal` / `-shm` / `-journal` sidecars to the configured path.
- It is a no-op once the target exists, when there is no legacy file, when the target
  path is itself `menuapp.db`, and for `:memory:`.

Covered by `server/src/db/migrate-legacy-db.test.ts`.

### Deployments that pinned `SQLITE_PATH` to a `menuapp.db` path

These keep working unchanged (the file is used as-is; auto-migration does not fire
because the target already exists). To adopt the new name, stop the container, rename
the file, and update `SQLITE_PATH`.

## Operator step outside the repo

The local working directory (`C:\Repos\menuapp`) and its `.git/worktrees/*` path
references are developer-local, not committed content. Renaming the checkout directory
to `mealflow` is a manual step and does not affect the repository.

## Consequences

- One more file in the `db/` module (the legacy shim); it can be deleted once every
  deployment has started at least once on the new name.
- CI, Docker build, and e2e continue to pass; `docs/architecture/overview.md` data
  model section is unaffected.
