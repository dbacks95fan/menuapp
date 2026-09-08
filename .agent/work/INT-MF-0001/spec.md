---
work_item: INT-MF-0001
product_id: MF
intent_commit: 102b89bd8e558e55d2bcdfb269c1e7ed9418fce3
frozen_artifact_sha256: 2bd53cda889ba464e15f81f4d6c4c278a6e2b1fe83185d7ec5a81e7aa4b3be8e
intent_content_sha256: b705c395b3cd04d066ba004018a1fe986a8e31c8e43255daf3e1d43e40cd6af8
base_commit: 920b86b1ccc439eb76c90fc47e54309407374194
spec_version: 1
status: draft
---
# Specification — INT-MF-0001: Rename product from MenuApp to MealFlow

Fact/decision provenance is tagged inline: **[FACT]** = verified in this repository at the cited path, **[DESIGN]** = a design decision made here within the intent's boundaries, **[ASSUME]** = an unverified assumption that a reviewer must confirm, **[DECIDE]** = a material choice escalated in §11 rather than made here.

## Intent fidelity

This specification covers exactly the frozen intent INT-MF-0001 (`content_hash b705c395…`, intent_version 3) and does not widen, narrow, or reinterpret it.

Restated boundaries, unchanged:

- The desired outcome is that **MealFlow** is the single consistent product name wherever the application, its supporting infrastructure, and its documented operation identify the product, while existing persisted household data remains accessible through the transition.
- In scope: product-identifying UI text, metadata, code identifiers, files, directories, configuration, package metadata, manifests, scripts, logs, health/status identifiers, documentation, deployment and infrastructure resources (Docker images, containers, Compose services, networks, volumes, paths, deployment scripts, Synology configuration), tests/fixtures/test data, and any required deployment, infrastructure, or persistence migration.
- Out of scope: functional changes unrelated to the rename; changing household recipes, saved ingredients, plans, or product preferences except as required to preserve them; renaming the GitHub repository `dbacks95fan/menuapp`.

One tension inside the frozen intent is noted, not resolved by restatement: the intent requires that **no deployed resource remains named `MenuApp`** while also fixing the target repository as **`dbacks95fan/menuapp`**. Because Docker Compose derives deployed resource names from the project directory (which by default matches the cloned repository name), satisfying both requires an explicit design measure. This is addressed in §6 (FR-7) and escalated where operator authority is needed in §11 (D2). No part of the intent is treated as relaxed.

## Confirmed repository context

Verified by direct inspection of the working tree. This is the complete product-identifying legacy-name inventory found by a case-insensitive search for `menuapp` / `menu app` / `menu-app`.

**Application and UI**

| Location | Current content | Category |
|---|---|---|
| `client/src/App.tsx:12` | `<h1>Menu App</h1>` | UI text **[FACT]** |
| `client/index.html:7` | `<title>Menu App</title>` | UI metadata / page title **[FACT]** |
| `server/src/index.ts:8` | `console.log(\`menuapp-server listening on port ${port}\`)` | Log identifier **[FACT]** |

**Package metadata**

| Location | Current content |
|---|---|
| `package.json:2` | `"name": "menuapp"` (npm workspaces root; workspaces `client`, `server`, `e2e`) **[FACT]** |
| `server/package.json:2` | `"name": "menuapp-server"` **[FACT]** |
| `e2e/package.json:2` | `"name": "menuapp-e2e"` **[FACT]** |
| `package-lock.json:2,8,34,4233,4237,6803` | Root name, workspace names, and `node_modules/menuapp-e2e` / `node_modules/menuapp-server` link entries **[FACT]** |
| `client/package.json:2` | `"name": "client"` — carries no product name; not in the rename inventory **[FACT]** |

**Persistence paths**

| Location | Current content |
|---|---|
| `server/src/db/index.ts:9` | default `./data/menuapp.db` (used when `SQLITE_PATH` unset and `NODE_ENV !== "test"`) **[FACT]** |
| `server/.env.example:2` | `SQLITE_PATH=./data/menuapp.db` **[FACT]** |
| `Dockerfile:23` | `ENV SQLITE_PATH=/app/data/menuapp.db` **[FACT]** |
| `server/src/db/index.ts:16` | `PRAGMA journal_mode = WAL` for any non-`:memory:` path **[FACT]** |

WAL mode is materially relevant: a WAL database is up to three files on disk — `<name>.db`, `<name>.db-wal`, `<name>.db-shm`. After an unclean stop, committed transactions can live only in the `-wal` sidecar. Any filename change must treat the set atomically. **[FACT]**

**Deployment and infrastructure**

- `docker-compose.yml` (9 lines, complete) declares one service `app` with `build: .`, `ports: "${HTTP_PORT:-4000}:4000"`, `volumes: ./data:/app/data`, `restart: unless-stopped`. It declares **no** top-level `name:`, no `image:`, no `container_name:`, no named volumes, and no named networks. **[FACT]**
- Consequence: image, container, and default network names are all derived by Compose from the project name, which defaults to the deployment directory's name. No legacy name is stored in the file itself — it is inherited from the filesystem at deploy time. **[FACT]**
- The `./data` mount is a **bind mount to a host path**, not a Docker named volume. Data therefore lives in the deployment directory on the NAS and is not managed by Docker's volume lifecycle. **[FACT]**
- `Dockerfile` is a two-stage build (`build`, `runtime`), `HEALTHCHECK` calls `http://localhost:4000/health`, `VOLUME ["/app/data"]`, `EXPOSE 4000`. No product name other than the `SQLITE_PATH` at line 23. **[FACT]**
- There is **no** Synology-specific configuration file in the repository. Synology deployment exists only as prose instructions in `README.md` ("Copy this repo … then run `docker compose up -d --build`"). The intent's "Synology configuration" scope item therefore has no in-repo artifact and resolves to host-side state plus documentation. **[FACT]**
- There are **no** deployment scripts in the repository; deployment is documented commands only. **[FACT]**
- `.github/workflows/ci.yml` runs `npm ci`, `npm run build`, `npm run test:server`, Playwright browser install, `npm run test:e2e`. The workflow contains no product name. **[FACT]**

**Tests**

- `e2e/tests/smoke.spec.ts:5` asserts `await expect(page).toHaveTitle("Menu App")` — this assertion currently **enforces** the legacy name and will fail the moment the title changes. **[FACT]**
- `e2e/playwright.config.ts:17` sets `SQLITE_PATH: ":memory:"` for the test server. The e2e suite therefore cannot, by construction, provide evidence about persisted-data survival. **[FACT]**
- Server unit tests are colocated (`server/src/app.test.ts`, `server/src/routes/recipes.test.ts`, `server/src/routes/preferences.test.ts`). None reference the product name. **[FACT]**

**Health/status**

- `server/src/routes/health.ts:5-7` returns `{ status: "ok" }`. It carries **no** product identifier — neither legacy nor new. **[FACT]**

**Documentation**

- `README.md:1` `# Menu App` (obsolete title); `README.md:22` references `./data/menuapp.db`. **[FACT]**
- `CLAUDE.md:9` reads `MealFlow (formerly "Menu App")` and `docs/product/overview.md:3` reads `formerly called "Menu App"` — these are **deliberate historical references**, already using MealFlow as authoritative. **[FACT]**
- `docs/architecture/overview.md`, `docs/decisions/0001-sqlite-over-postgres.md`, `docs/plans/README.md`, `ARCHITECTURE.md` contain no legacy name. **[FACT]**
- `client/README.md` is the stock Vite template readme; no product name. **[FACT]**

**Occurrences excluded from the rename inventory as non-product-identifying or immutable**

- `.agent/work/INT-MF-0001/intent.md` — the frozen intent itself; immutable. **[FACT]**
- `spec-design-request.json:13` — SDLC tooling artifact recording the local checkout path `C:/Repos/menuapp`. **[FACT]**
- `.git/` internals. **[FACT]**
- The repository slug `dbacks95fan/menuapp`, explicitly out of scope per the intent. **[FACT]**

**Repository conventions that constrain this work** (from `CLAUDE.md`): no application authentication; `node:sqlite` persistence with no native module; a single Docker container serving API and client on one configurable port; Synology DiskStation deployment target; desktop and mobile browser support; new tables/migrations extend the `CREATE TABLE IF NOT EXISTS` block in `server/src/db/index.ts` as **there is no separate migration runner**. **[FACT]**

## User and system-observable outcomes

1. A household member opening the app on desktop or mobile sees **MealFlow** as the page heading, and the browser tab/window title reads **MealFlow**. No screen, control, or metadata visible to that user shows "Menu App", "MenuApp", or "menu-app".
2. That user's existing recipes, ingredient lists, grocery aggregation, and stored preferences are present and unchanged after the rename is deployed, and remain present after the container is restarted.
3. A maintainer inspecting the running deployment sees container, image, network, and volume/path names that identify MealFlow; no running or stopped resource representing this product carries the legacy name.
4. A maintainer reading server logs sees the service identify itself as MealFlow at startup.
5. A maintainer following `README.md` can deploy to the Synology DiskStation, and — for an existing installation — can follow a documented migration runbook that carries existing data across the rename without loss.
6. A maintainer running a case-insensitive repository-wide search for the legacy name finds only occurrences on an agreed, documented exclusion list (§11 D4).
7. Nothing else observable changes: the same routes, the same API surface, the same port, the same absence of authentication.

## Functional requirements and acceptance criteria

Every requirement below has at least one observable acceptance criterion. "Legacy name" means any case-insensitive form of `MenuApp`, `Menu App`, or `menu-app`.

---

**FR-1 — UI product name.** The rendered application identifies itself as MealFlow.
*Covers:* `client/src/App.tsx:12`, `client/index.html:7`.
- **AC-1.1** The application header renders the exact string `MealFlow`.
- **AC-1.2** The HTML document title is `MealFlow`.
- **AC-1.3** A Playwright assertion verifies the title equals `MealFlow` (replacing the current assertion at `e2e/tests/smoke.spec.ts:5`).

**FR-2 — Absence of the legacy name from the UI.** No user-visible surface exposes the legacy name.
- **AC-2.1** Playwright coverage navigates every route wired in `client/src/App.tsx` (`/`, `/add-recipe`, `/groceries`) and asserts the legacy name is absent from the rendered page content on each.
- **AC-2.2** The same coverage asserts the legacy name is absent from the document title on each route.
- **AC-2.3** `MealFlow` is asserted present on each of those routes.

**FR-3 — Package and workspace metadata.** Product-identifying npm package names use MealFlow, and the dependency lockfile stays internally consistent.
- **AC-3.1** `package.json` name is `mealflow`; `server/package.json` name is `mealflow-server`; `e2e/package.json` name is `mealflow-e2e`. **[DESIGN]** — lowercase, hyphenated, preserving the existing `<product>`/`<product>-<workspace>` shape, because npm package names must be lowercase.
- **AC-3.2** `package-lock.json` is regenerated so that root name, workspace names, and workspace link entries carry the new names, with no residual `menuapp*` package keys.
- **AC-3.3** `npm ci` completes successfully from a clean checkout — this is the observable proof that the lockfile matches the manifests, and it is already exercised by `.github/workflows/ci.yml:19`.

**FR-4 — Runtime log and status identifiers.** Emitted operational identifiers name MealFlow and never the legacy name.
- **AC-4.1** The server startup log line at `server/src/index.ts:8` identifies the service as `mealflow-server`.
- **AC-4.2** No log statement in `server/` emits the legacy name.

**FR-5 — Persistence path defaults.** Default database paths identify MealFlow consistently across code, example configuration, and image configuration.
- **AC-5.1** `server/src/db/index.ts` default path is `./data/mealflow.db`.
- **AC-5.2** `server/.env.example` sets `SQLITE_PATH=./data/mealflow.db`.
- **AC-5.3** `Dockerfile` sets `ENV SQLITE_PATH=/app/data/mealflow.db`.
- **AC-5.4** These three values are mutually consistent — the containerized default is the in-image absolute form of the source default.
- *Note:* the mechanism for carrying an existing database file across this filename change is escalated as **D1** in §11. FR-6 states the outcome that mechanism must achieve, whichever option is chosen.

**FR-6 — Persisted data continuity.** Data written before the rename is readable after the rename is deployed, and remains readable after a container restart.
- **AC-6.1** In a controlled deployment exercise: recipes and preferences created on the pre-rename build are all present and byte-identical in content after deploying the post-rename build.
- **AC-6.2** The same data is still present after `docker compose restart` (or stop/start) of the renamed deployment.
- **AC-6.3** The migration handles the complete WAL file set — `<name>.db`, `<name>.db-wal`, `<name>.db-shm` — such that a database stopped uncleanly (with a non-empty `-wal`) loses no committed transaction. **[FACT]**-driven, per `server/src/db/index.ts:16`.
- **AC-6.4** The migration is non-destructive of the source: the pre-migration data is recoverable if the migration is abandoned partway (see FR-8 rollback).
- **AC-6.5** The migration is idempotent — re-running it, or restarting an already-migrated deployment, neither fails nor alters data.

**FR-7 — Deployed resource naming.** No deployed resource representing this product carries the legacy name.
- **AC-7.1** `docker-compose.yml` declares an explicit top-level project `name` of `mealflow`, so that deployed resource names no longer depend on the deployment directory's name. **[DESIGN]** — this is what reconciles the intent's "no deployed resource named MenuApp" with its constraint that the repository stays `dbacks95fan/menuapp`, since a clone of that repository produces a `menuapp/` directory.
- **AC-7.2** The built image is explicitly named for MealFlow rather than inheriting a directory-derived name.
- **AC-7.3** After deployment, `docker ps -a`, `docker image ls`, `docker network ls`, and `docker volume ls` on the target host show no resource representing this product whose name matches the legacy name case-insensitively.
- **AC-7.4** Pre-existing containers, images, and networks created under the old project name are removed as a documented migration step, not left as orphans. **[DESIGN]** — Compose does not rename existing resources when a project name changes; it creates new ones and leaves the old set behind, which would silently fail AC-7.3.
- **AC-7.5** The host bind-mount path used for `./data` is documented, and any change to it is covered by the FR-6 continuity criteria. Host-side directory naming on the DiskStation is escalated as **D3** in §11.

**FR-8 — Documentation and migration runbook.** Documented operation identifies MealFlow, and the migration is written down and verified.
- **AC-8.1** `README.md` title and body identify MealFlow, including the `SQLITE_PATH` reference at line 22 and the Synology deployment section.
- **AC-8.2** A migration runbook exists in the repository covering: pre-migration backup of the data directory, the ordered stop/migrate/deploy/verify steps, removal of legacy-named Docker resources (AC-7.4), the post-migration verification check, and a rollback path returning the deployment to the pre-rename build with data intact.
- **AC-8.3** The runbook has been executed at least once against a realistic deployment, and the evidence from that execution is recorded (satisfying the intent's "documented **and verified**").
- **AC-8.4** Historical references of the form `formerly "Menu App"` in `CLAUDE.md:9` and `docs/product/overview.md:3` are handled per the disposition agreed in **D4** (§11); they are not silently deleted or silently kept without a recorded decision.

**FR-9 — Tests, fixtures, and test data.** Test assets identify MealFlow and actively enforce the rename.
- **AC-9.1** No test file asserts the legacy name as expected output. Specifically, `e2e/tests/smoke.spec.ts:5` no longer expects `"Menu App"`.
- **AC-9.2** Test workspace and fixture identifiers use MealFlow (covered for package naming by AC-3.1).
- **AC-9.3** The e2e suite fails if the legacy name reappears in the UI — i.e. FR-2's assertions are negative assertions, not merely positive ones.

**FR-10 — Verifiable repository-wide search.** The intent's search-based acceptance criterion is mechanically checkable.
- **AC-10.1** A case-insensitive repository-wide search for `menuapp|menu app|menu-app` returns only entries on the agreed exclusion list.
- **AC-10.2** The exclusion list is recorded in the repository with a one-line justification per entry, and is derived from **D4** (§11). The baseline proposed set is: `.git/`, `.agent/work/INT-MF-0001/intent.md` (frozen intent), `spec-design-request.json` (tooling artifact), and the repository slug `dbacks95fan/menuapp` wherever it appears as a repository reference.
- **AC-10.3** The search command and its output are captured as evidence.

**FR-11 — Build, deploy, start, restart integrity.** The rename does not break the delivery pipeline or the runtime.
- **AC-11.1** `npm run build` succeeds.
- **AC-11.2** `npm run test:server` succeeds with no test removed or skipped to accommodate the rename.
- **AC-11.3** `npm run test:e2e` succeeds.
- **AC-11.4** `.github/workflows/ci.yml` passes end to end on the change.
- **AC-11.5** `docker compose up -d --build` produces a container that reaches a healthy state via the existing `HEALTHCHECK` against `/health`.
- **AC-11.6** The container survives a restart and returns to healthy.

**FR-12 — Health/status identifier.** The health endpoint carries no legacy identifier.
- **AC-12.1** `GET /health` response contains no occurrence of the legacy name.
- **AC-12.2** The response shape remains a JSON object whose `status` field is `"ok"` on success — the existing `HEALTHCHECK` (`Dockerfile:27-28`) and the Playwright `webServer.url` readiness probe (`e2e/playwright.config.ts:14`) both depend on this endpoint, so its contract is not changed as a side effect of the rename.
- *Note:* the intent lists "health/status identifiers" in scope, but the confirmed fact is that this endpoint contains **no** product name today (`server/src/routes/health.ts:5-7`). Whether to *add* a MealFlow identifier to the payload is escalated as **D5** in §11; it is not assumed here.

## Non-functional requirements

- **NFR-1 Behavioral neutrality.** No functional change beyond identity. Routes, API paths (`/api/recipes`, `/api/preferences`, `/health`), request/response shapes, the database schema (`recipes`, `preferences`), and the single-port/single-process model are unchanged. *Observable:* the existing server unit tests and e2e specs pass without modification other than the legacy-name assertions identified in FR-9.
- **NFR-2 Architectural constraints preserved.** No authentication is added; persistence stays `node:sqlite` with no native module; a single container continues to serve both API and built client on one configurable `PORT` (default 4000); the deployment target remains a Synology DiskStation with no cloud dependency. *Observable:* `Dockerfile` still produces one runtime image with one `CMD`; `docker-compose.yml` still declares exactly one service; no new dependency appears in `package-lock.json` other than as a consequence of the workspace rename.
- **NFR-3 Portability.** The change introduces nothing requiring native compilation and continues to build and run on both a Windows development machine and Avoton-class Synology hardware (`docs/architecture/overview.md:48-53`). *Observable:* CI build passes and the image builds on the target architecture.
- **NFR-4 Client compatibility.** Desktop and mobile browsers continue to render the app correctly with the new name. *Observable:* the renamed header does not introduce layout overflow at mobile viewport widths in the e2e run.
- **NFR-5 Bounded downtime and recoverability.** The migration is a planned single-maintenance-window operation for a single household. A definite downtime bound is not set here because it depends on the D1 mechanism; the runbook must state the expected window and the rollback trigger. *Observable:* the runbook contains both.
- **NFR-6 Data integrity over convenience.** Where migration convenience conflicts with the risk of data loss, integrity wins — no step may delete or overwrite an existing database file whose successful migration has not first been verified.
- **NFR-7 Evidence durability.** Verification evidence (search output, deployment/restart transcript, Playwright results) is captured in a form a reviewer can inspect after the fact, not merely asserted.

## Design and affected boundaries

**Boundaries touched**

1. **Client presentation** (`client/src/App.tsx`, `client/index.html`) — string-level only; no component structure, routing, or styling change. `client/src/components/NavBar.tsx` carries no product name and is unaffected. **[FACT]**
2. **Server runtime identity** (`server/src/index.ts`) — log string only.
3. **Server persistence configuration** (`server/src/db/index.ts`) — the default path literal only. The schema block and the WAL pragma are unchanged. Because `CLAUDE.md` records that **there is no migration runner**, any startup-time file migration would be new machinery in this file, which is precisely why the mechanism is escalated (D1) rather than chosen here.
4. **Package/workspace identity** (`package.json`, `server/package.json`, `e2e/package.json`, `package-lock.json`) — renaming npm workspace packages invalidates the lockfile's workspace link entries; regeneration is mandatory, not optional (AC-3.2/AC-3.3).
5. **Container image configuration** (`Dockerfile`) — the `SQLITE_PATH` env default only. Build stages, healthcheck, exposed port, and `VOLUME` declaration are unchanged.
6. **Compose/orchestration** (`docker-compose.yml`) — gains an explicit project `name` and an explicit image name. This is the one place where the design adds configuration rather than editing a string, and it is the mechanism by which AC-7.3 becomes achievable while the repository keeps its legacy slug. **[DESIGN]**
7. **Host-side deployment state on the DiskStation** — the deployment directory, the `./data` bind-mount contents, and pre-existing Docker resources under the old project name. This boundary is **outside the repository**; the repository can only carry documentation and the migration runbook for it. Anything here requires operator action (D2, D3).
8. **Test suite** (`e2e/tests/smoke.spec.ts`, plus new/extended specs for FR-2) — assertion updates and added negative coverage.
9. **Documentation** (`README.md`, migration runbook, and per D4, the historical notes in `CLAUDE.md` and `docs/product/overview.md`).

**Explicitly not touched:** `.github/workflows/ci.yml` (contains no product name), `client/package.json` (name is `client`), `client/README.md` (stock template), `server/src/app.ts`, the three route files' logic, the server unit tests, `ARCHITECTURE.md`, `docs/architecture/overview.md`, `docs/decisions/`, `docs/plans/`, `.dockerignore`, `.gitignore`, and the `dbacks95fan/menuapp` repository slug. **[FACT]**

**Design decisions recorded here**

- **[DESIGN] Naming convention.** Human-facing surfaces use `MealFlow`; machine identifiers (npm package names, image/container/project names, filenames, paths) use lowercase `mealflow`, with the existing suffix pattern preserved (`mealflow-server`, `mealflow-e2e`). Rationale: npm names must be lowercase, and Docker resource names conventionally are; this keeps the mapping from the old identifiers one-to-one and mechanically checkable.
- **[DESIGN] Explicit Compose project naming** (AC-7.1) rather than relying on directory name, because the directory name is downstream of a repository name the intent freezes.
- **[DESIGN] Explicit legacy-resource teardown as a migration step** (AC-7.4), because Compose leaves old-project resources in place rather than renaming them.
- **[DESIGN] Negative UI assertions** (AC-9.3), so the rename is enforced by the suite rather than merely reflected in it.

**[ASSUME]** The current Synology deployment directory is named after the legacy product (e.g. `.../menuapp`) and its `./data` subdirectory holds the live `menuapp.db` file set. This is not verifiable from the repository and must be confirmed by the operator before the runbook is finalized; the migration steps for D2/D3 depend on it.

**[ASSUME]** There is exactly one production deployment (a single household on one DiskStation), so no coordinated multi-instance rollout is required.

## Data, security, privacy, and compliance considerations

- **Data at rest.** The only persistent store is a single SQLite file plus WAL sidecars on a host bind mount (`server/src/db/index.ts`, `docker-compose.yml:6-7`). Its contents are household recipes, ingredient lists, and preferences (`docs/architecture/overview.md:39-42`) — no credentials, no payment data, no third-party personal data. **[FACT]**
- **Schema and semantics unchanged.** The rename does not alter table names, column names, or stored values. Row contents are opaque to this work. This directly serves the intent's out-of-scope clause about not changing household recipes, ingredients, plans, or preferences.
- **The principal data risk is file-level, not record-level.** Changing the database filename (FR-5) on a live deployment is the single point at which household data can be lost, and WAL sidecars make a naive single-file rename genuinely unsafe (AC-6.3). Mandatory controls: a full copy of the data directory taken before any migration step, non-destructive migration (AC-6.4), and a verification step that reads back actual rows before the pre-migration copy is released.
- **Security posture unchanged.** No authentication exists and none is added (`CLAUDE.md`); the app remains LAN-only with no TLS and no reverse proxy (`docs/architecture/overview.md:14-17`). The rename neither widens nor narrows the exposure surface. The exposed port binding (`${HTTP_PORT:-4000}:4000`) is unchanged.
- **No secrets involved.** `server/.env.example` contains only `PORT` and `SQLITE_PATH` (`server/.env.example:1-2`) — no secret is being renamed, relocated, or logged. No credential appears in any file in the rename inventory. Migration evidence and runbook text must contain no host credentials or SSH keys.
- **Compliance.** *Not applicable in a regulatory sense* — single-household, no-auth, no external data sharing, no regulated data category present. Recorded here rather than marked "Not relevant" because the data-handling analysis above is in scope.
- **Log content.** The startup log change (FR-4) emits a service name only; no user data enters logs as a result of this work.

## Error handling and operational behavior

- **Migration failure must be safe, not silent.** If the migration cannot locate, move, or open the database file set, the outcome must be an explicit, actionable failure with the pre-migration data untouched — never a silently created empty database. This is the highest-consequence failure mode in the change: today, `server/src/db/index.ts:11` calls `mkdirSync(..., {recursive:true})` and `new DatabaseSync(dbPath)` will happily **create** a fresh empty database at any path that does not exist. A rename of the default path without migration therefore presents as a working, healthy, *empty* app — passing the healthcheck, passing e2e (which uses `:memory:`), and losing nothing visibly until a household member notices their recipes are gone. **[FACT]**-driven.
  - **AC-EH-1** The migration/verification procedure detects the "started against an unexpectedly empty database" condition and treats it as a failure requiring rollback, rather than a normal first run.
- **Startup behavior.** If a startup-time migration is chosen (D1 option c), it must run before the schema block executes, be idempotent (AC-6.5), refuse to overwrite an existing target file, and log what it did or did not do. If a manual step is chosen (D1 option b), the server's behavior is unchanged and the runbook carries the entire burden.
- **Restart behavior.** `restart: unless-stopped` (`docker-compose.yml:8`) means a crash-looping container will retry indefinitely. A migration that fails at startup would therefore loop; the failure must be visible in `docker compose logs` on the first iteration and must not perform partial work on each retry.
- **Health reporting.** `/health` remains the liveness signal for both the container healthcheck and Playwright's readiness probe. It reports process liveness only and does **not** today assert database readability (`server/src/routes/health.ts`). Reviewers should note that a healthy container is therefore *not* evidence that data survived the migration — AC-6.1/AC-6.2 must be verified by reading actual application data, not by the healthcheck.
- **Rollback.** Rollback is: stop the renamed deployment, restore the pre-migration data directory copy, redeploy the previous build, verify data. This must be documented (AC-8.2) and must be possible without reversing any code change by hand.
- **Orphaned resources.** Between the old and new Compose project names, both sets of containers/networks can coexist and both can bind the same host port — producing a port conflict or, worse, a stale old-named container still serving traffic. The runbook must bring the old project fully down before bringing the new one up (AC-7.4).

## Validation strategy

Mapped to the intent's three required evidence items.

**E1 — Playwright UI coverage** (intent evidence 1)
- Extend `e2e/tests/` so that, for each route in `client/src/App.tsx` (`/`, `/add-recipe`, `/groceries`): `MealFlow` is asserted present, the legacy name is asserted absent from page content, and the document title is asserted to equal `MealFlow` (AC-1.2, AC-1.3, AC-2.1–2.3, AC-9.3).
- Runs against the real built server per `e2e/playwright.config.ts:12`, matching what is deployed.
- Evidence: Playwright HTML report from a passing run.

**E2 — Deployment and persistence evidence** (intent evidence 2)
- This **cannot** be covered by the existing e2e suite, which runs against `SQLITE_PATH=":memory:"` (`e2e/playwright.config.ts:17`). A separate controlled exercise is required. **[FACT]**
- Procedure: deploy the pre-rename build; create known recipes and preferences; copy the data directory; execute the migration runbook; deploy the post-rename build; verify every known record is present and unchanged (AC-6.1); `restart` the container and re-verify (AC-6.2); confirm healthy state (AC-11.5, AC-11.6); confirm no legacy-named Docker resource remains (AC-7.3).
- Include at least one case where the source database was stopped uncleanly with a non-empty `-wal` file, to exercise AC-6.3.
- Include the idempotence check: run the migration path a second time and confirm no change (AC-6.5).
- Evidence: command transcript with before/after record listings and `docker ps -a` / `image ls` / `network ls` / `volume ls` output.

**E3 — Repository-wide search evidence** (intent evidence 3)
- A recorded case-insensitive search for `menuapp|menu app|menu-app` across the working tree, with output shown and every remaining hit matched to the documented exclusion list (AC-10.1–10.3).

**Supporting checks**
- `npm ci` from clean checkout (AC-3.3), `npm run build` (AC-11.1), `npm run test:server` (AC-11.2), `npm run test:e2e` (AC-11.3), and a green CI run (AC-11.4).

**Known validation gaps to state at review**
- No automated test can prove AC-7.3; it is verified by inspected command output on the target host.
- No automated test covers the Synology host-side directory migration; it is verified by runbook execution (AC-8.3).
- The `/health` endpoint does not validate database readability, so it cannot substitute for E2.

## Dependencies, assumptions, and non-goals

**Dependencies**
- Docker Compose on the target host must support the top-level `name:` field (Compose Specification / Compose v2). **[ASSUME]** — needs confirmation against the Container Manager version on the DiskStation, since AC-7.1 depends on it. If unsupported, D2's fallback (renaming the deployment directory) becomes mandatory rather than optional.
- npm workspaces support for renaming workspace packages and regenerating `package-lock.json` (already in use, `package.json:5-9`). **[FACT]**
- Operator access to the DiskStation (SSH or Container Manager) to perform teardown, directory/data migration, and redeploy. **[FACT]** per `README.md` deployment instructions.
- Node 24 toolchain as pinned in CI and both Docker stages. **[FACT]**

**Assumptions** (each requires reviewer confirmation)
- **A1** The live deployment directory on the NAS is named for the legacy product, and its `./data` holds the live database file set.
- **A2** There is exactly one production deployment and one household of users; a maintenance window is acceptable.
- **A3** There are no external consumers of the API, no bookmarks or integrations keyed to a product-named path, and no other system referencing the container or image by its legacy name. The repository shows no such consumer, but this cannot be proven from inside the repository.
- **A4** No backup/monitoring job on the NAS references the legacy database filename or legacy container name. If one exists, it is host-side and outside this repository's visibility, and would break silently on rename.
- **A5** `docs/product/overview.md` and `CLAUDE.md` already treating MealFlow as authoritative means the naming target is settled and no alternative spelling (e.g. "Meal Flow") is under consideration.

**Non-goals** (restated from the intent, plus scope clarifications derived from confirmed facts)
- No functional change unrelated to the rename.
- No change to household recipes, saved ingredients, plans, or preferences except as required to preserve them.
- No renaming of the `dbacks95fan/menuapp` GitHub repository.
- No addition of checkout, payment, or Fry's/Kroger functionality.
- No introduction of a general-purpose migration runner. `CLAUDE.md` records that none exists and says to revisit only when the schema needs a real change; this rename does not change the schema. Any migration built here is scoped to this one file-path transition.
- No change to the `/health` contract, the port model, the authentication posture, or the single-container architecture.
- No modification of `.agent/work/INT-MF-0001/intent.md` or `spec-design-request.json`.

## Risks and unresolved decisions

**Unresolved decisions — these require a decision-maker; they are not made in this specification.**

**D1 — How is the existing SQLite database carried across the filename change?**
- *Impact:* This is the only step that can destroy household data. Getting it wrong presents as a healthy, empty app (see §8) rather than an obvious failure. It also determines whether new startup logic enters `server/src/db/index.ts`, which `CLAUDE.md` currently keeps free of migration machinery.
- *Options:* (a) Keep the database filename as `menuapp.db` and rename nothing on disk — lowest risk, but leaves a product-identifying path unchanged, which conflicts with the intent's explicit inclusion of "paths" in scope. (b) Rename the filename and perform the move as a **documented manual runbook step** during a maintenance window — no new code, human-verified, but relies on the operator executing it correctly and handling the WAL sidecar set. (c) Rename the filename and add an **idempotent startup migration** that moves the legacy file set to the new name when the legacy set exists and the new one does not — self-executing and repeatable, but introduces automatic file manipulation of user data at boot, in a codebase that deliberately has no migration runner. (d) Option (c) gated behind an explicit opt-in environment variable, defaulting to off.
- *Minimum authority:* Product/technical owner for the data-loss risk and the architectural exception to the "no migration runner" convention; plus the deployment operator, since (b) puts the burden on them.

**D2 — How are legacy-named deployed Docker resources eliminated, given the repository slug stays `dbacks95fan/menuapp`?**
- *Impact:* Directly determines whether intent acceptance criterion "No deployed resource remains named `MenuApp`" can be met. Compose derives names from the project directory, and a clone of the frozen repository slug produces a legacy-named directory.
- *Options:* (a) Set top-level `name: mealflow` in `docker-compose.yml` (the design proposed in AC-7.1) and leave the deployment directory as-is. (b) Rename the deployment directory on the NAS to `mealflow` and rely on directory-derived naming. (c) Both, for defence in depth. (d) Additionally set an explicit `container_name`. All options require tearing down the old-project resources (AC-7.4); none rename them in place.
- *Minimum authority:* Deployment operator (host-side teardown and any directory rename), with technical owner sign-off on the Compose change. Also requires confirming the host's Compose version supports top-level `name:` (see Dependencies).

**D3 — Does the host data directory path change, and if so how does the data move?**
- *Impact:* The `./data` bind mount is relative to the deployment directory. If D2 selects a directory rename, the live database moves with it — a second file-level data-migration surface on top of D1, in the same maintenance window.
- *Options:* (a) Keep the deployment directory and host data path unchanged (only viable alongside D2 option a). (b) Rename the deployment directory and move the data directory with it as a documented runbook step. (c) Rename the directory and repoint the bind mount to an absolute, explicitly named host path.
- *Minimum authority:* Deployment operator, with technical owner sign-off.

**D4 — What is the agreed exclusion set for the "no obsolete `MenuApp` references" search, and what happens to the deliberate historical references?**
- *Impact:* Without an agreed list, the intent's first acceptance criterion is not objectively verifiable — and taken literally it would require editing the frozen intent file itself. It also decides the fate of `CLAUDE.md:9` and `docs/product/overview.md:3`, which say `formerly "Menu App"` as intentional provenance, not as stale naming.
- *Options:* (a) Exclude `.git/`, `.agent/`, `spec-design-request.json`, and the repository slug; **keep** the historical "formerly" phrasings as non-obsolete provenance. (b) Same exclusions but **remove** the historical phrasings for a zero-hit result. (c) Same exclusions, keep the phrasings, and add them explicitly to the documented exclusion list with justification.
- *Minimum authority:* Product owner (this is a scope interpretation of the frozen intent's wording).

**D5 — Should the `/health` payload gain a MealFlow identifier?**
- *Impact:* The intent lists "health/status identifiers" in scope, but the confirmed fact is that `/health` carries no product name at all today. Adding one changes an external-ish contract consumed by the container `HEALTHCHECK` and Playwright's readiness probe; not adding one leaves an in-scope category untouched.
- *Options:* (a) Leave `{ status: "ok" }` unchanged — nothing obsolete is present, so nothing needs renaming. (b) Add a `service`/`name` field identifying MealFlow alongside the existing `status` field, leaving `status` intact.
- *Minimum authority:* Technical owner.

**Risks**

| ID | Risk | Likelihood / Impact | Mitigation |
|---|---|---|---|
| R1 | Silent data loss: renamed path yields a new empty database that looks healthy and passes every automated check | Medium / **Severe** | AC-EH-1; mandatory pre-migration copy; E2 verifies actual rows, not health status; AC-6.4 non-destructive |
| R2 | WAL sidecar left behind, losing committed transactions after an unclean stop | Medium / Severe | AC-6.3; E2 includes an unclean-stop case |
| R3 | Orphaned legacy-named containers/network survive the project rename, failing AC-7.3 or conflicting on the host port | **High** / Moderate | AC-7.4 explicit teardown step; AC-7.3 verified by inspected host output |
| R4 | `package-lock.json` not regenerated after workspace rename → `npm ci` fails in CI and in the Docker build (`Dockerfile:10`) | Medium / Moderate | AC-3.2, AC-3.3, AC-11.4 |
| R5 | Host-side backup or monitoring job references the legacy filename or container name and breaks silently (A4) | Low / Moderate | Operator confirms A4 before the migration window |
| R6 | Compose version on the DiskStation does not support top-level `name:`, invalidating the AC-7.1 design | Low / Moderate | Confirm before implementation; D2 fallback options exist |
| R7 | Over-eager find-and-replace edits the frozen intent, tooling artifacts, or the repository slug, violating explicit out-of-scope boundaries | Medium / Moderate | AC-10.2 documented exclusion list; targeted edits per the §2 inventory rather than a blanket replace |
| R8 | The rename is judged "done" on repository evidence alone, with host-side infrastructure never actually renamed | Medium / Moderate | E2 and AC-8.3 require executed, recorded host-side evidence |
| R9 | Longer header text causes mobile layout overflow | Low / Low | NFR-4 |

## Traceability to frozen intent

**Intent acceptance criteria → requirements**

| # | Frozen intent acceptance criterion | Requirements | Acceptance criteria |
|---|---|---|---|
| IAC-1 | A case-insensitive repository-wide search finds no obsolete `MenuApp` references that identify the product | FR-10 (with FR-1, FR-3, FR-4, FR-5, FR-8, FR-9 removing the sources) | AC-10.1, AC-10.2, AC-10.3 — scope of "obsolete" pending **D4** |
| IAC-2 | UI, code, configuration, metadata, tests, scripts, logs, docs, files, directories, deployment resources, and infrastructure use `MealFlow` where they identify the product | FR-1 (UI), FR-3 (metadata/config), FR-4 (logs), FR-5 (files/paths), FR-7 (deployment/infrastructure), FR-8 (docs), FR-9 (tests), FR-12 (health/status) | AC-1.1, AC-1.2, AC-3.1, AC-3.2, AC-4.1, AC-4.2, AC-5.1–5.4, AC-7.1, AC-7.2, AC-8.1, AC-9.1, AC-9.2, AC-12.1 — *note:* no deployment **scripts** exist in the repository (§2), so that sub-category resolves to documented commands under FR-8; health/status identifiers pending **D5** |
| IAC-3 | No deployed resource remains named `MenuApp` when it represents MealFlow | FR-7 | AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5 — mechanism pending **D2** |
| IAC-4 | The application builds, deploys, starts, and restarts successfully after the change | FR-11 | AC-11.1, AC-11.2, AC-11.3, AC-11.4, AC-11.5, AC-11.6 |
| IAC-5 | Existing persisted data remains accessible after the migration | FR-6 | AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5, AC-EH-1 — mechanism pending **D1**, host path pending **D3** |
| IAC-6 | Migration steps are documented and verified | FR-8 | AC-8.2 (documented), AC-8.3 (verified by execution with recorded evidence) |

**Intent evidence requirements → validation**

| # | Frozen intent evidence requirement | Validation | Requirements |
|---|---|---|---|
| IEV-1 | Executable Playwright coverage confirms MealFlow is shown throughout the UI, MenuApp is absent from the UI, and the page title uses MealFlow | §9 **E1** | FR-1 (AC-1.3), FR-2 (AC-2.1, AC-2.2, AC-2.3), FR-9 (AC-9.1, AC-9.3) |
| IEV-2 | Automated or controlled deployment evidence confirms persisted data remains available after deployment and restart | §9 **E2** — must be a controlled deployment exercise, because the existing e2e suite runs in-memory and cannot supply this | FR-6 (AC-6.1, AC-6.2, AC-6.3), FR-11 (AC-11.5, AC-11.6), FR-7 (AC-7.3) |
| IEV-3 | Repository-wide search evidence confirms the required rename scope | §9 **E3** | FR-10 (AC-10.1, AC-10.2, AC-10.3) |

**Intent scope items → coverage**

| Frozen intent scope item | Covered by |
|---|---|
| Rename product-identifying UI text, metadata, code identifiers, files, and directories | FR-1, FR-2, FR-3, FR-5 |
| Rename product-identifying configuration, package metadata, manifests, scripts, logs, health/status identifiers, and documentation | FR-3, FR-4, FR-5, FR-8, FR-12 |
| Rename deployment and infrastructure resources (Docker images, containers, Compose services, networks, volumes, paths, deployment scripts, Synology configuration) | FR-7, FR-8 (Synology configuration exists only as documentation — §2) |
| Update tests, fixtures, and test data that identify the product | FR-9 |
| Provide and verify any required deployment, infrastructure, or persistence migration | FR-6, FR-8 |

**Intent out-of-scope items → enforcement**

| Frozen intent out-of-scope item | Enforced by |
|---|---|
| Functional changes unrelated to the product rename | NFR-1, NFR-2; §10 non-goals |
| Changing household recipes, saved ingredients, plans, or preferences except as required to preserve them | §7 (schema and record semantics unchanged); FR-6 |
| Renaming `dbacks95fan/menuapp` | AC-10.2 exclusion list; §10 non-goals; the AC-7.1 design exists specifically so this constraint need not be violated |

**Intent constraints → coverage**

| Frozen intent constraint | Covered by |
|---|---|
| Existing persisted data must remain accessible after deployment and restart | FR-6 (AC-6.1, AC-6.2), FR-11 (AC-11.6) |
| The work does not add checkout, payment, or unrelated Fry's functionality | NFR-1; §10 non-goals |
| The configured target engineering repository remains `dbacks95fan/menuapp` | §10 non-goals; FR-7 design (AC-7.1) |

---

**Status: ready for Design Review — not approved.** Five decisions (**D1** persistence migration mechanism, **D2** deployed-resource renaming approach, **D3** host data directory, **D4** search exclusion set and historical references, **D5** health payload identifier) are outside this agent's authority and are open. D1, D2, and D3 gate implementation, because FR-5/FR-6 and FR-7 cannot be implemented safely until they are settled.
