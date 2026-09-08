import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // The app under test is one process with one SQLite database, so specs share
  // state. Run them serially and in a predictable order.
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? "html" : "list",
  use: {
    baseURL: "http://localhost:4000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run build && npm run start --workspace server",
    cwd: "..",
    url: "http://localhost:4000/health",
    reuseExistingServer: !process.env.CI,
    env: {
      SQLITE_PATH: ":memory:",
      PORT: "4000",
      NODE_ENV: "production",
      MEALFLOW_ENABLE_TEST_RESET: "1",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
