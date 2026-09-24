import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-firefox", use: { ...devices["Desktop Firefox"] } },
    {
      name: "mobile-firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: "pnpm exec next dev --turbopack --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
