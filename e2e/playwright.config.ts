import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: "html",
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
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
