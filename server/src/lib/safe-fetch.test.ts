// ABOUTME: Tests for the SSRF address guard used by recipe URL import.
import { describe, expect, it } from "vitest";
import { fetchHtml, isBlockedAddress } from "./safe-fetch.js";

describe("isBlockedAddress", () => {
  it("blocks loopback, private, link-local and CGNAT ranges", () => {
    for (const addr of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.1.1", "100.64.0.1", "::1"]) {
      expect(isBlockedAddress(addr)).toBe(true);
    }
  });

  it("allows public addresses", () => {
    for (const addr of ["8.8.8.8", "1.1.1.1", "203.0.113.10"]) {
      expect(isBlockedAddress(addr)).toBe(false);
    }
  });
});

describe("fetchHtml", () => {
  it("rejects non-http(s) schemes", async () => {
    await expect(fetchHtml("file:///etc/passwd")).rejects.toThrow(/http/i);
  });

  it("rejects localhost and private targets before making a request", async () => {
    await expect(fetchHtml("http://localhost:9999/x")).rejects.toThrow(/not allowed/i);
    await expect(fetchHtml("http://127.0.0.1/x")).rejects.toThrow(/not allowed/i);
    await expect(fetchHtml("http://192.168.0.5/x")).rejects.toThrow(/not allowed/i);
  });
});
