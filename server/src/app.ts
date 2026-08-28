import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { healthRouter } from "./routes/health.js";
import { preferencesRouter } from "./routes/preferences.js";
import { recipesRouter } from "./routes/recipes.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const clientDist = join(currentDir, "..", "..", "client", "dist");

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(healthRouter);
  app.use(recipesRouter);
  app.use(preferencesRouter);

  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api|\/health).*/, (_req, res) => {
      res.sendFile(join(clientDist, "index.html"));
    });
  }

  return app;
}
