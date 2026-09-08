// ABOUTME: Tests for the Kroger API client against a stubbed fetch.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addToCart,
  buildAuthorizeUrl,
  getProductToken,
  KrogerError,
  resetProductTokenCache,
  searchProducts,
} from "./kroger-client.js";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  resetProductTokenCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

describe("getProductToken", () => {
  it("fetches once and caches until expiry", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ access_token: "tok", expires_in: 1800 }));

    expect(await getProductToken()).toBe("tok");
    expect(await getProductToken()).toBe("tok");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(String(init.body)).toContain("grant_type=client_credentials");
  });

  it("throws a KrogerError on a failed token request", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false, 401));
    await expect(getProductToken()).rejects.toBeInstanceOf(KrogerError);
  });
});

describe("searchProducts", () => {
  it("normalizes the Kroger product shape", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: [
          {
            productId: "0001",
            upc: "0001111",
            description: "Organic Whole Milk",
            brand: "Simple Truth",
            items: [{ price: { regular: 4.29 }, size: "64 fl oz" }],
            images: [{ sizes: [{ size: "medium", url: "http://img/milk.jpg" }] }],
          },
        ],
      }),
    );

    const products = await searchProducts("milk", "1234", "access");
    expect(products[0]).toEqual({
      productId: "0001",
      upc: "0001111",
      description: "Organic Whole Milk",
      brand: "Simple Truth",
      size: "64 fl oz",
      price: 4.29,
      imageUrl: "http://img/milk.jpg",
    });
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("filter.term=milk");
    expect(String(url)).toContain("filter.locationId=1234");
  });
});

describe("buildAuthorizeUrl", () => {
  it("requests the cart.basic:write scope and carries state", () => {
    const url = new URL(buildAuthorizeUrl("abc123"));
    expect(url.searchParams.get("scope")).toContain("cart.basic:write");
    expect(url.searchParams.get("state")).toBe("abc123");
    expect(url.searchParams.get("response_type")).toBe("code");
  });
});

describe("addToCart", () => {
  it("surfaces the HTTP status on failure", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false, 403));
    await expect(addToCart([{ upc: "1", quantity: 1 }], "tok")).rejects.toMatchObject({
      status: 403,
    });
  });

  it("resolves on a 2xx", async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, true, 204));
    await expect(addToCart([{ upc: "1", quantity: 2 }], "tok")).resolves.toBeUndefined();
  });
});
