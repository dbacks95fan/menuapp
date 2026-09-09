// ABOUTME: Server entrypoint — loads env, builds the app, starts listening.
import "dotenv/config";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

const app = createApp();

app.listen(config.port, () => {
  logger.info(`mealflow-server listening on port ${config.port}`);
});
