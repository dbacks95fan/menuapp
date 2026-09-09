# Security

## Threat model

MealFlow runs on a single household's trusted home LAN, reached by the Synology
DiskStation's LAN IP over plain HTTP. There is **no application authentication**
by design (see `CLAUDE.md`). It is never exposed to the public internet. The
assets worth protecting are the household's recipe data and (from Phase 4) a
stored Kroger OAuth refresh token.

Given that model, the baseline controls below defend against hostile input and
accidental misuse from other devices on the LAN, not against an attacker who
already controls the network.

## Controls in place

- **HTTP security headers** via `helmet` (`server/src/app.ts`): a restrictive
  `Content-Security-Policy` (`default-src 'self'`, `object-src 'none'`,
  `script-src 'self'`), `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: no-referrer`, and
  `x-powered-by` removed. `upgrade-insecure-requests` and HSTS are deliberately
  **off** — the deployment is plain HTTP and those directives would break asset
  loading or be meaningless.
  - Note: the CSP has no `'unsafe-inline'` for `script-src`. If future UI work
    introduces inline `style={{…}}` attributes, `style-src` will need review.
- **Request body size limit**: `express.json({ limit: "1mb" })`.
- **Rate limiting**: `express-rate-limit` on `/api` (600 requests / 15 min / IP).
- **Input validation**: request bodies are parsed with `zod` schemas in each
  route; invalid input gets a `400` with a safe message.
- **Error handling**: a terminal error handler (`server/src/middleware/error-handler.ts`)
  logs 5xx via `pino` and returns a generic body — no stack traces or internal
  messages to clients.
- **Logging**: `pino` with `redact` for `authorization` / `cookie` /
  `set-cookie` so credentials never land in logs.
- **CORS**: off in production (one origin serves API + SPA). Enabled only when
  `CORS_ORIGINS` is set, for a split dev setup.
- **Container**: multi-stage build, runs as the unprivileged `node` user
  (uid 1000), base image pinned to an explicit patch release.

## Dependency auditing

CI runs `npm audit --omit=dev --audit-level=high` (`npm run audit:prod`) and
fails on a HIGH+ advisory in **production** dependencies — the set actually
shipped in the Docker image (`npm install --omit=dev`).

Known accepted items:

- `qs` (moderate, via `express@4`) — reachable only through a full Express 5
  upgrade; moderate severity, low real risk for a LAN-only, no-auth service.
  Revisit with an Express 5 upgrade.
- Dev-tooling advisories (Vitest UI / Vite dev server) are not part of the
  deployed artifact and are not gated. Keep the dev toolchain current.

## Follow-ups

- Pin the Docker base image by `sha256` digest (needs a build environment with
  registry access).
- Make the runtime image's production dependency install lockfile-exact.

## Reporting

This is a personal household project. Raise an issue on the repository.
