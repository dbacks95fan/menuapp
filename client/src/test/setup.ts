// ABOUTME: Vitest setup — registers jest-dom matchers and auto-cleans the DOM
// ABOUTME: between tests.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
