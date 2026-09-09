// ABOUTME: Thin client for the Kroger (Fry's) Public API — client-credentials
// ABOUTME: token for product search, Authorization Code flow for the cart, plus
// ABOUTME: product/location lookups and PUT /cart/add. Base URL from config so
// ABOUTME: tests can point it at a mock server.
import { config } from "../config.js";

export interface KrogerTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}

export interface KrogerProduct {
  productId: string;
  upc: string;
  description: string;
  brand: string | null;
  size: string | null;
  price: number | null;
  imageUrl: string | null;
}

export interface KrogerLocation {
  locationId: string;
  name: string;
  address: string;
}

export class KrogerError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

function basicAuthHeader(): string {
  const raw = `${config.kroger.clientId}:${config.kroger.clientSecret}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

async function tokenRequest(body: URLSearchParams): Promise<KrogerTokens> {
  const res = await fetch(`${config.kroger.apiBase}/connect/oauth2/token`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: basicAuthHeader(),
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new KrogerError(`Fry's token request failed (HTTP ${res.status})`);
  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
  };
}

let productToken: KrogerTokens | null = null;

export async function getProductToken(): Promise<string> {
  if (productToken && productToken.expiresAt > Date.now()) return productToken.accessToken;
  productToken = await tokenRequest(
    new URLSearchParams({ grant_type: "client_credentials", scope: "product.compact" }),
  );
  return productToken.accessToken;
}

/** Test seam: drop the cached client-credentials token. */
export function resetProductTokenCache(): void {
  productToken = null;
}

export function buildAuthorizeUrl(state: string): string {
  const url = new URL(`${config.kroger.apiBase}/connect/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.kroger.clientId ?? "");
  url.searchParams.set("redirect_uri", config.kroger.redirectUri);
  url.searchParams.set("scope", "cart.basic:write profile.compact");
  url.searchParams.set("state", state);
  return url.toString();
}

export function exchangeCode(code: string): Promise<KrogerTokens> {
  return tokenRequest(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.kroger.redirectUri,
    }),
  );
}

export function refreshTokens(refreshToken: string): Promise<KrogerTokens> {
  return tokenRequest(
    new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  );
}

interface RawProduct {
  productId: string;
  description?: string;
  brand?: string;
  items?: { itemId?: string; price?: { regular?: number }; size?: string }[];
  images?: { sizes?: { size?: string; url?: string }[] }[];
  upc?: string;
}

function normalizeProduct(raw: RawProduct): KrogerProduct {
  const item = raw.items?.[0];
  const image = raw.images?.[0]?.sizes?.find((s) => s.url)?.url ?? null;
  return {
    productId: raw.productId,
    upc: raw.upc ?? raw.productId,
    description: raw.description ?? "Unknown product",
    brand: raw.brand ?? null,
    size: item?.size ?? null,
    price: item?.price?.regular ?? null,
    imageUrl: image,
  };
}

async function productGet(path: string, accessToken: string): Promise<RawProduct[]> {
  const res = await fetch(`${config.kroger.apiBase}${path}`, {
    headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new KrogerError(`Fry's product lookup failed (HTTP ${res.status})`);
  const json = (await res.json()) as { data?: RawProduct[] };
  return json.data ?? [];
}

export async function searchProducts(
  term: string,
  locationId: string | null,
  accessToken: string,
  limit = 5,
): Promise<KrogerProduct[]> {
  const params = new URLSearchParams({ "filter.term": term, "filter.limit": String(limit) });
  if (locationId) params.set("filter.locationId", locationId);
  return (await productGet(`/products?${params.toString()}`, accessToken)).map(normalizeProduct);
}

export async function getProductById(
  productId: string,
  locationId: string | null,
  accessToken: string,
): Promise<KrogerProduct | null> {
  const params = new URLSearchParams();
  if (locationId) params.set("filter.locationId", locationId);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const rows = await productGet(`/products/${encodeURIComponent(productId)}${suffix}`, accessToken);
  return rows[0] ? normalizeProduct(rows[0]) : null;
}

export async function findLocations(zip: string, accessToken: string): Promise<KrogerLocation[]> {
  const res = await fetch(
    `${config.kroger.apiBase}/locations?${new URLSearchParams({ "filter.zipCode.near": zip, "filter.limit": "10" })}`,
    { headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" }, signal: AbortSignal.timeout(10_000) },
  );
  if (!res.ok) throw new KrogerError(`Fry's location lookup failed (HTTP ${res.status})`);
  const json = (await res.json()) as {
    data?: { locationId: string; name?: string; address?: { addressLine1?: string; city?: string; state?: string } }[];
  };
  return (json.data ?? []).map((loc) => ({
    locationId: loc.locationId,
    name: loc.name ?? "Fry's",
    address: [loc.address?.addressLine1, loc.address?.city, loc.address?.state].filter(Boolean).join(", "),
  }));
}

export async function addToCart(
  items: { upc: string; quantity: number }[],
  accessToken: string,
): Promise<void> {
  const res = await fetch(`${config.kroger.apiBase}/cart/add`, {
    method: "PUT",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ items: items.map((i) => ({ upc: i.upc, quantity: i.quantity })) }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new KrogerError(`Fry's cart add failed (HTTP ${res.status})`, res.status);
}
