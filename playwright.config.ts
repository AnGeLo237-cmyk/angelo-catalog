// =============================================================================
// CONFIGURATION PLAYWRIGHT
// -----------------------------------------------------------------------------
// - Auto-démarre `npm run dev` (sauf si déjà lancé)
// - 3 projets : setup (login), visitor (anonyme), merchant (authentifié)
// - Workers = 1 : évite les conflits DB entre tests parallèles
// - Charge .env.test pour les variables E2E
// =============================================================================

import { defineConfig, devices } from "@playwright/test"
import { config as loadEnv } from "dotenv"

loadEnv({ path: ".env.test" })

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,         // 15s par action (fill, click…)
    navigationTimeout: 30_000,     // 30s par navigation
  },

  expect: {
    timeout: 15_000,               // 15s par assertion toBeVisible
  },  

  // Démarre `npm run dev` si non lancé. 2 min max pour le boot.
  webServer: {
    command: process.env.CI || process.env.E2E_PROD
        ? "npm run start"
        : "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },

  projects: [
    // 1. Login une fois, sauvegarde les cookies
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    // 2. Visiteur anonyme (pas de storageState)
    {
      name: "visitor",
      testMatch: /visitor\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // 3. Commerçant authentifié (storageState + dépend du setup)
    {
      name: "merchant",
      testMatch: /merchant\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/merchant.json",
      },
      dependencies: ["setup"],
    },
  ],
})