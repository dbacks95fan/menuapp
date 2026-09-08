// ABOUTME: Parses and validates the process environment once at startup into a
// ABOUTME: typed, frozen `config` object consumed across the server.
import { z } from "zod";

const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  SQLITE_PATH: z.string().min(1).optional(),
  // Comma-separated list of allowed browser origins for dev cross-origin calls.
  // Empty (the default) means "no CORS" — correct for the single-origin prod deploy.
  CORS_ORIGINS: z.string().default(""),
  LOG_LEVEL: z.enum(LOG_LEVELS).optional(),

  // AES-256 key (hex/base64/utf8, >= 32 bytes) for encrypting the stored Fry's
  // token. Required only to connect a Fry's account.
  MEALFLOW_SECRET_KEY: z.string().min(1).optional(),
  // Fry's / Kroger developer app credentials + endpoints.
  KROGER_CLIENT_ID: z.string().min(1).optional(),
  KROGER_CLIENT_SECRET: z.string().min(1).optional(),
  KROGER_API_BASE: z.string().url().default("https://api.kroger.com/v1"),
  KROGER_REDIRECT_URI: z.string().url().default("http://localhost:4000/api/frys/callback"),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;
const isTest = env.NODE_ENV === "test";

export const config = Object.freeze({
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
  isTest,
  port: env.PORT,
  sqlitePath: env.SQLITE_PATH ?? (isTest ? ":memory:" : "./data/mealflow.db"),
  corsOrigins: env.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  logLevel: env.LOG_LEVEL ?? (isTest ? "silent" : "info"),
  secretKey: env.MEALFLOW_SECRET_KEY ?? null,
  kroger: {
    clientId: env.KROGER_CLIENT_ID ?? null,
    clientSecret: env.KROGER_CLIENT_SECRET ?? null,
    apiBase: env.KROGER_API_BASE.replace(/\/$/, ""),
    redirectUri: env.KROGER_REDIRECT_URI,
    configured: Boolean(env.KROGER_CLIENT_ID && env.KROGER_CLIENT_SECRET && env.MEALFLOW_SECRET_KEY),
  },
});

export type Config = typeof config;
