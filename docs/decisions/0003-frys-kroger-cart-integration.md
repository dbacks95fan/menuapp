# 0003 — Fry's / Kroger cart integration

**Status**: Accepted (spike + implementation)

## Context

MealFlow needs to put the week's groceries into a Fry's cart. Fry's is Kroger's
Arizona banner and shares Kroger's developer platform, so this integrates with
the **Kroger Public API** (`https://api.kroger.com/v1`). "Fry's" is the label
shown to the user; `kroger` is the code/module name.

## Findings (spike — story 20)

- **There is an approved cart API.** `PUT /cart/add` adds items (`{ upc, quantity }[]`)
  to the authenticated customer's cart. There is **no checkout API** — placing the
  order stays in Kroger's own apps. That matches our scope (add-to-cart only).
- **Two OAuth2 flows are needed:**
  - *Product search & locations* — `client_credentials` grant, scope
    `product.compact`. App-level, no user. Cached until expiry.
  - *Cart writes* — `authorization_code` grant, scope `cart.basic:write`
    (`profile.compact` alongside it). Requires the customer to log in at Kroger
    and approve. Returns an access token (~30 min) **and a refresh token**.
- **We never see or store the customer's Kroger password** — only the tokens
  returned by the code exchange (story 21).
- **Rate limits**: roughly 10,000 calls/day per endpoint per app; cart calls are
  more limited. A household's weekly run is dozens of calls, well inside that.
- **Store matters**: product price/availability is per `locationId`. The user
  picks a home Fry's once (via `GET /locations?filter.zipCode.near=`).
- **Fallback if cart access were unavailable**: the combined grocery list is
  already reviewable and could be exported as text/CSV. Not needed — cart access
  is available.

## Decision

- **One shared household Kroger account.** MealFlow stays login-free (per
  `CLAUDE.md`). The household connects one Kroger account; everyone on the LAN
  uses it.
- **Token storage**: the refresh token (JSON blob of access+refresh+expiry) is
  encrypted with AES-256-GCM (`server/src/lib/crypto.ts`, key from
  `MEALFLOW_SECRET_KEY`) and kept in the single `household` row. Access tokens
  are refreshed transparently (`server/src/lib/frys-account.ts`); Kroger may omit
  a new refresh token on refresh, so the old one is retained.
- **Credentials** come from env only and are never committed:
  `KROGER_CLIENT_ID`, `KROGER_CLIENT_SECRET`, `MEALFLOW_SECRET_KEY`, and
  optionally `KROGER_API_BASE` / `KROGER_REDIRECT_URI`. Fry's features are
  inert until all three of the first are set (`config.kroger.configured`).
- **OAuth `state`** is a random value held in server memory for 10 minutes and
  consumed once. A server restart mid-connect just means restarting the
  few-second flow.
- **Matching** (`GET /api/frys/match`): pantry items are excluded; a remembered
  choice (`ingredient_product_map`, keyed by normalized ingredient name) is
  re-priced by product id; otherwise the top few `GET /products` results are
  offered. Choosing a product (`PUT /api/frys/match/:name`) upserts the map, so a
  brand picked once is reused for every later recipe (stories 22, 23).
- **Cart submit** (`POST /api/frys/cart`): items are added **one request each**
  so one bad UPC does not sink the rest. The response always returns 200 with
  `{ added, failed, allSucceeded }` — the UI reports partial failure honestly and
  never claims complete success on a partial (story 24).

## Known limitations / follow-ups

- **Needed quantity is always 1.** Converting a recipe amount ("2 cups") against a
  product size ("16 oz") to a pack count is not implemented; the review screen
  lets the user adjust. This is the main follow-up.
- Redirect URI must be registered in the Kroger app config and match
  `KROGER_REDIRECT_URI` exactly (default `http://localhost:4000/api/frys/callback`;
  set it to the NAS LAN URL in production).
- e2e coverage runs against a mock Kroger server (`e2e/mock-kroger.mjs`), not the
  real API.
