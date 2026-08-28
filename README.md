# Menu App

A self-hosted recipe / meal-planning app for the household: browse recipes, add new ones, and see a
combined grocery list. Runs as a single Docker container (Express serves both the API and the built
React client) backed by SQLite on a mounted volume — designed to run on a Synology DiskStation.

## Structure

- `client/` — React frontend (Vite)
- `server/` — Express API, serves the built client and persists data to SQLite (`node:sqlite`)
- `e2e/` — Playwright end-to-end tests
- `Dockerfile` / `docker-compose.yml` — single-container deployment

## Local development

```
npm install
npm run dev:server   # API on http://localhost:4000
npm run dev:client   # client on http://localhost:5173 (proxies /api and /health to :4000)
```

Server config (see `server/.env.example`): `PORT` (default 4000), `SQLITE_PATH` (default `./data/menuapp.db`).

## Testing

```
npm run test:server   # server unit tests (vitest)
npm run test:e2e      # Playwright e2e tests (builds client+server, runs the real server)
```

## Running with Docker

```
docker compose up -d --build
```

- App is served at `http://localhost:4000` (override with `HTTP_PORT=8080 docker compose up -d`).
- Data persists in `./data` on the host, mounted into the container at `/app/data`.
- No authentication — intended for a trusted home network.
- Health check: `GET /health`.

### Deploying to a Synology DiskStation

Copy this repo (or just `Dockerfile`, `docker-compose.yml`, and the source) onto the NAS, then from
that directory run `docker compose up -d --build` (via SSH, or Container Manager's compose project
import). Set `HTTP_PORT` to whatever port you want exposed on the DiskStation's LAN IP.

## CI

GitHub Actions (`.github/workflows/ci.yml`) builds and runs server + e2e tests on every push and pull request.
