import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    reuseExistingServer: !process.env.CI,
    url: "http://127.0.0.1:5173",
  },
  projects: [{ name: "chromium", use: devices["Desktop Chrome"] }],
});
