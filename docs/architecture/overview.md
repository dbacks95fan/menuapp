# Architecture Overview

## Stack

- **Client**: React 19 + Vite + TypeScript, `react-router-dom` for routing.
- **Server**: Express + TypeScript, serves both the JSON API (`/api/*`, `/health`)
  and the built client (`client/dist`) from one process on one port.
- **Persistence**: SQLite via Node's built-in `node:sqlite` (no native module —
  chosen specifically to avoid native-compile friction on both a dev Windows
  machine and an ARM/x86 Synology NAS). See `docs/decisions/0001-sqlite-over-postgres.md`.
- **Tests**: Vitest for server unit tests; Playwright for end-to-end tests, run
  against the real built server (not the Vite dev server) so what's tested
  matches what's deployed.
- **Deployment**: single Docker image (multi-stage build), `docker-compose.yml`
  with a configurable `HTTP_PORT` and a bind-mounted `./data` volume for the
  SQLite file. Target: a Synology DiskStation on the home LAN, reached by its LAN
  IP — no reverse proxy, no TLS, no auth.

## Why one container, not client+server+db as separate services

This is a single-household, no-auth, home-NAS app. Running a separate database
container (Postgres) or a separate frontend container adds real operational
weight (more containers to keep healthy on a resource-constrained NAS) for no
benefit at this scale. The Express server serving the built SPA plus API is the
whole runtime; SQLite is a file on the same mounted volume.

## Request flow

```
Browser --> :PORT (Express)
              |-- /health           -> liveness
              |-- /api/recipes      -> server/src/routes/recipes.ts
              |-- /api/preferences  -> server/src/routes/preferences.ts
              '-- everything else   -> client/dist/index.html (SPA fallback)
```

## Data model (current)

```
recipes(id, name, ingredients JSON-encoded-array, created_at)
preferences(key, value, updated_at)
```

No migration tool yet — schema changes are additive `CREATE TABLE IF NOT EXISTS` /
manual `ALTER TABLE` in `server/src/db/index.ts`. Revisit this once the schema
needs a real change, not preemptively.

## Known constraints future work must respect

- No authentication, by design (see `CLAUDE.md`).
- Single configurable port, one process.
- Must run on both a Windows dev machine and a Synology DiskStation (older
  Avoton-class hardware in the current deployment) without native compilation.
