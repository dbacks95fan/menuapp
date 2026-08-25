# Menu App

Restaurant menu application. React (Vite + TypeScript) client, Express (TypeScript) API, PostgreSQL database.

## Structure

- `client/` — React frontend (Vite)
- `server/` — Express API
- `e2e/` — Playwright end-to-end tests

## Setup

```
npm install
cp server/.env.example server/.env
```

Fill in `server/.env` with your local Postgres connection string.

## Development

```
npm run dev:server   # API on http://localhost:4000
npm run dev:client   # client on http://localhost:5173
```

## Testing

```
npm run test:server   # server unit tests (vitest)
npm run test:e2e      # Playwright end-to-end tests
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs builds and tests on every push and pull request.
