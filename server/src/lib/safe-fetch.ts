// ABOUTME: SSRF-guarded HTML fetch for recipe URL import — blocks non-HTTP(S)
// ABOUTME: schemes and private/loopback address targets, follows a few
// ABOUTME: redirects (re-checking each), and caps the response size.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class FetchError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function isBlockedAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const [a, b] = address.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (family === 6) {
    const lower = address.toLowerCase();
    return (
      lower === "::1" ||
      lower === "::" ||
      lower.startsWith("fe80") ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("::ffff:127.") ||
      lower.startsWith("::ffff:10.") ||
      lower.startsWith("::ffff:192.168.")
    );
  }
  return false;
}

async function assertPublicHost(hostname: string): Promise<void> {
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new FetchError("That host is not allowed.");
  }
  if (isIP(hostname)) {
    if (isBlockedAddress(hostname)) throw new FetchError("That address is not allowed.");
    return;
  }
  const results = await lookup(hostname, { all: true });
  if (results.length === 0 || results.some((r) => isBlockedAddress(r.address))) {
    throw new FetchError("That host resolves to a blocked address.");
  }
}

export async function fetchHtml(
  rawUrl: string,
  { maxBytes = 3_000_000, maxRedirects = 4, timeoutMs = 8000 } = {},
): Promise<string> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new FetchError("That is not a valid URL.");
  }

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new FetchError("Only http and https URLs are supported.");
    }
    await assertPublicHost(url.hostname);

    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": "MealFlow/1.0 (recipe importer)", accept: "text/html" },
    });

    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location") as string, url);
      continue;
    }
    if (!res.ok) throw new FetchError(`The page returned HTTP ${res.status}.`, 422);

    const body = res.body;
    if (!body) return "";
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new FetchError("That page is too large to import.", 422);
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf8");
  }

  throw new FetchError("Too many redirects.", 422);
}
