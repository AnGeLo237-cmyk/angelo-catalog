import { test as setup, expect } from "@playwright/test"
import { MERCHANT } from "./fixtures"
import { existsSync, mkdirSync } from "node:fs"

const authFile = "e2e/.auth/merchant.json"

setup("authentification commerçant", async ({ page }) => {
  if (!MERCHANT.email || !MERCHANT.password) {
    throw new Error(
      "E2E_MERCHANT_EMAIL et E2E_MERCHANT_PASSWORD sont requis dans .env.test"
    )
  }

  if (!existsSync("e2e/.auth")) {
    mkdirSync("e2e/.auth", { recursive: true })
  }

  // Timeout large : le premier hit sur /login peut être lent (cold compile)
  setup.setTimeout(60_000)

  await page.goto("/login", { waitUntil: "networkidle" })

  // Attendre que le formulaire soit hydraté : le champ email doit être visible
  // ET le bouton submit doit exister (preuve que React a rendu le composant)
  await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 15_000 })
  await expect(
    page.getByRole("button", { name: /se connecter|connexion|sign in/i })
  ).toBeVisible({ timeout: 15_000 })

  await page.getByLabel(/email/i).fill(MERCHANT.email)
  await page.getByLabel(/mot de passe|password/i).fill(MERCHANT.password)

  await page
    .getByRole("button", { name: /se connecter|connexion|sign in/i })
    .click()

  // Attendre soit la redirection (succès), soit un message d'erreur (échec)
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
  } catch {
    // Capture du message d'erreur affiché par le formulaire
    const errorText = await page
      .locator('[role="alert"]')
      .first()
      .textContent()
      .catch(() => "(aucun message d'erreur détecté)")

    throw new Error(
      `Login échoué — URL actuelle: ${page.url()}\n` +
        `Message d'erreur affiché: ${errorText}\n` +
        `Vérifiez :\n` +
        `  1. Le compte ${MERCHANT.email} existe dans Supabase Auth\n` +
        `  2. Le compte est "Auto Confirm User"\n` +
        `  3. Le mot de passe dans .env.test est correct`
    )
  }

  await expect(
    page.getByText(/tableau de bord|dashboard/i).first()
  ).toBeVisible({ timeout: 10_000 })

  await page.context().storageState({ path: authFile })
})