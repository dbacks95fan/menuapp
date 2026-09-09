// ABOUTME: Terminal Express error handler: logs 5xx via pino and returns a safe
// ABOUTME: JSON body, never leaking a stack trace or internal message to clients.
import type { NextFunction, Request, Response } from "express";
import { logger } from "../logger.js";

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

// The unused `_next` is required — Express only treats a 4-arg function as an
// error handler.
export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err.status ?? err.statusCode ?? 500;

  if (status >= 500) {
    logger.error({ err }, "unhandled request error");
  }

  res.status(status).json({
    error: status < 500 && err.message ? err.message : "Internal server error",
  });
}
