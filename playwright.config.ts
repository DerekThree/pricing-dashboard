import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://127.0.0.1:5174",
    headless: true,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5174",
    reuseExistingServer: false,
    url: "http://127.0.0.1:5174",
    env: {
      BACKEND_API_URL: "http://127.0.0.1:18080",
      ACCOUNT_PROCESSOR_API_URL: "http://127.0.0.1:18081",
    },
  },
  projects: [{ name: "chromium", use: devices["Desktop Chrome"] }],
});
