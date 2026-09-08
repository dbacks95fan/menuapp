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
});

export type Config = typeof config;
