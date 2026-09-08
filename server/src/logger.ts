// ABOUTME: Shared pino logger instance; level comes from validated config.
import { pino } from "pino";
import { config } from "./config.js";

export const logger = pino({
  level: config.logLevel,
  // Keep credentials out of logs even though the LAN app has no auth today —
  // Phase 4 (Kroger) will put bearer tokens on outbound requests.
  redact: ["req.headers.authorization", "req.headers.cookie", 'res.headers["set-cookie"]'],
});
