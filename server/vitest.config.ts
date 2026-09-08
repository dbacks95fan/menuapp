// ABOUTME: Vitest config — run only the TypeScript source tests, never the
// ABOUTME: compiled copies under dist/.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
