// ABOUTME: Stores the household's Fry's OAuth tokens encrypted at rest and hands
// ABOUTME: out a valid access token, refreshing transparently.
import { config } from "../config.js";
import { db } from "../db/index.js";
import { decryptSecret, encryptSecret } from "./crypto.js";
import { exchangeCode, refreshTokens, type KrogerTokens } from "./kroger-client.js";

interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}

export class FrysNotConnectedError extends Error {
  status = 409;
  constructor(message = "Connect a Fry's account first.") {
    super(message);
  }
}

function tokensColumn(): string | null {
  const row = db.prepare("SELECT kroger_tokens_enc FROM household WHERE id = 1").get() as {
    kroger_tokens_enc: string | null;
  };
  return row.kroger_tokens_enc;
}

export function isFrysConnected(): boolean {
  return tokensColumn() != null;
}

function readTokens(): StoredTokens | null {
  const enc = tokensColumn();
  if (!enc || !config.secretKey) return null;
  return JSON.parse(decryptSecret(enc, config.secretKey)) as StoredTokens;
}

function writeTokens(tokens: KrogerTokens): void {
  if (!config.secretKey) throw new Error("MEALFLOW_SECRET_KEY is not set");
  const enc = encryptSecret(JSON.stringify(tokens), config.secretKey);
  db.prepare(
    `UPDATE household
       SET kroger_tokens_enc = ?,
           kroger_connected_at = COALESCE(kroger_connected_at, datetime('now'))
     WHERE id = 1`,
  ).run(enc);
}

export function clearFrysTokens(): void {
  db.prepare(
    "UPDATE household SET kroger_tokens_enc = NULL, kroger_connected_at = NULL WHERE id = 1",
  ).run();
}

export async function connectWithCode(code: string): Promise<void> {
  writeTokens(await exchangeCode(code));
}

export async function getUserAccessToken(): Promise<string> {
  const tokens = readTokens();
  if (!tokens) throw new FrysNotConnectedError();
  if (tokens.expiresAt > Date.now()) return tokens.accessToken;
  if (!tokens.refreshToken) {
    clearFrysTokens();
    throw new FrysNotConnectedError("Your Fry's session expired — reconnect the account.");
  }
  const refreshed = await refreshTokens(tokens.refreshToken);
  const merged: KrogerTokens = {
    ...refreshed,
    refreshToken: refreshed.refreshToken ?? tokens.refreshToken,
  };
  writeTokens(merged);
  return merged.accessToken;
}
