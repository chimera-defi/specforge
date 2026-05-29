import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["demo.spec.ts", "e2e/**/*.spec.ts"],
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "bun run build && bun x next start --hostname 127.0.0.1",
      port: 3000,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        PORT: "3000",
        NEXT_PUBLIC_COLLAB_URL: "ws://127.0.0.1:4322",
        SPECFORGE_DB_PATH: ".data/specforge-db-playwright.json",
        SPECFORGE_PILOT_TRIAGE_WORKSPACE_ID: "ws_demo",
      },
    },
    {
      command: "bun run --cwd ../collab-server start",
      port: 4322,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        PORT: "4322",
      },
    },
  ],
});
