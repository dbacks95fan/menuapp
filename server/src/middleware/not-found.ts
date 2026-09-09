// ABOUTME: Terminal 404 for unmatched /api routes, so the SPA history-fallback
// ABOUTME: never swallows a mistyped API path into an HTML response.
import type { Request, Response } from "express";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not found" });
}
