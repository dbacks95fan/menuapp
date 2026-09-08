// ABOUTME: AES-256-GCM helpers for encrypting a single secret at rest (the
// ABOUTME: household's Fry's refresh token). Key comes from MEALFLOW_SECRET_KEY.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function deriveKey(key: string): Buffer {
  // Accept hex or base64 that decodes to >= 32 bytes, else raw utf8 bytes.
  for (const encoding of ["hex", "base64"] as const) {
    try {
      const buf = Buffer.from(key, encoding);
      if (buf.length >= 32) return buf.subarray(0, 32);
    } catch {
      // try next
    }
  }
  const raw = Buffer.from(key, "utf8");
  if (raw.length >= 32) return raw.subarray(0, 32);
  throw new Error("MEALFLOW_SECRET_KEY must be at least 32 bytes");
}

export function encryptSecret(plaintext: string, key: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(key), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function decryptSecret(payload: string, key: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("malformed ciphertext");
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(key), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString(
    "utf8",
  );
}
