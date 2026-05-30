import { defineConfig, devices } from "@playwright/test";

process.env.ALIZ_ALLOW_LOCAL_DEMO_AUTH ??= "true";
process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS ??= "true";
process.env.OWNER_EMAIL ??= "owner@alizstudio.test";
process.env.OWNER_PASSWORD ??= "local-owner-password-for-tests";
process.env.OWNER_NAME ??= "Aliz Studio Owner";
process.env.OWNER_SESSION_SECRET ??= "local-playwright-owner-session-secret-change-me";

const edgeExecutablePath =
  process.platform === "win32" ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" : undefined;

const webServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER
  ? undefined
  : {
      command: "node node_modules/next/dist/bin/next dev -p 3000",
      url: "http://127.0.0.1:3000",
      timeout: 120_000,
      reuseExistingServer: !process.env.CI
    };

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    launchOptions: edgeExecutablePath ? { executablePath: edgeExecutablePath } : undefined,
    trace: "on-first-retry"
  },
  webServer,
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1100 }
      }
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"]
      }
    }
  ]
});
