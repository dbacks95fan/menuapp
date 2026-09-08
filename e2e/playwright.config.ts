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
  webServer: [
    {
      command: "node mock-kroger.mjs",
      url: "http://localhost:4010/health",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run build && npm run start --workspace server",
      cwd: "..",
      url: "http://localhost:4000/health",
      reuseExistingServer: !process.env.CI,
      env: {
        SQLITE_PATH: ":memory:",
        PORT: "4000",
        NODE_ENV: "production",
        MEALFLOW_ENABLE_TEST_RESET: "1",
        MEALFLOW_SECRET_KEY: "e2e-secret-key-0123456789abcdef0123456789",
        KROGER_CLIENT_ID: "mock-client",
        KROGER_CLIENT_SECRET: "mock-secret",
        KROGER_API_BASE: "http://localhost:4010",
        KROGER_REDIRECT_URI: "http://localhost:4000/api/frys/callback",
      },
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
