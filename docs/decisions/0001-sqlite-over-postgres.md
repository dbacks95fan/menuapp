# 0001 — SQLite over Postgres

**Status**: Accepted

## Context

The app was initially scaffolded with Postgres (a separate `pg` dependency and a
connection pool). Once the real deployment target was confirmed — a single
household's Synology DiskStation, no authentication, single-container deploy —
running a second database container became questionable: more to operate on a
resource-constrained NAS, for an app with one concurrent user population (one
household).

`better-sqlite3` was tried first and rejected: it requires native compilation
(node-gyp, Python), which failed outright on the Windows dev machine (no Python
toolchain installed) and would have been a repeat risk on the NAS's older
Avoton CPU.

## Decision

Use Node's built-in `node:sqlite` module. No native dependency, works
identically across the Windows dev machine and the Synology NAS, one file on a
mounted volume satisfies the "data survives restart and container replacement"
requirement directly.

## Consequences

- No separate database container in `docker-compose.yml` — one service.
- No concurrent-write concerns worth engineering for at this scale.
- If the app ever needs true multi-user concurrent access, this decision should
  be revisited — it was made for a single-household, single-writer workload.
- `node:sqlite` is a newer builtin; some tooling (bundlers/test runners) doesn't
  yet recognize `node:sqlite` as a builtin module. Worked around in this repo by
  loading it via `process.getBuiltinModule("node:sqlite")` rather than a static
  `import` (see `server/src/db/index.ts`) — sidesteps the tooling gap rather than
  fighting it.
