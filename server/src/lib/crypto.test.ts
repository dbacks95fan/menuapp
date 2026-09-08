// ABOUTME: Tests for AES-256-GCM secret encryption used to store the Fry's token.
import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./crypto.js";

const KEY = "0123456789abcdef0123456789abcdef";

describe("encryptSecret / decryptSecret", () => {
  it("round-trips a value", () => {
    const cipher = encryptSecret("refresh-token-xyz", KEY);
    expect(cipher).not.toContain("refresh-token-xyz");
    expect(decryptSecret(cipher, KEY)).toBe("refresh-token-xyz");
  });

  it("produces different ciphertext each time (random iv)", () => {
    expect(encryptSecret("x", KEY)).not.toBe(encryptSecret("x", KEY));
  });

  it("rejects a tampered ciphertext", () => {
    const cipher = encryptSecret("secret", KEY);
    const tampered = `${cipher.slice(0, -2)}00`;
    expect(() => decryptSecret(tampered, KEY)).toThrow();
  });

  it("rejects a wrong key", () => {
    const cipher = encryptSecret("secret", KEY);
    expect(() => decryptSecret(cipher, "ffffffffffffffffffffffffffffffff")).toThrow();
  });

  it("rejects a key shorter than 32 bytes", () => {
    expect(() => encryptSecret("x", "tooshort")).toThrow(/key/i);
  });
});
