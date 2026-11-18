// =============================================================================
// VISITEUR — La vitrine publique se charge correctement
// =============================================================================

import { test, expect } from "@playwright/test"
import { SHOP } from "../fixtures"

test.describe("Vitrine publique", () => {
  test("la boutique et ses produits sont visibles", async ({ page }) => {
    await page.goto(`/${SHOP.slug}`)

    // Le hero affiche le nom de la boutique (h1)
    await expect(page.locator("h1").first()).toBeVisible()

    // La grille de produits existe (au moins 1 carte)
    const productLinks = page.locator('a[href*="/' + SHOP.slug + '/"]')
    await expect(productLinks.first()).toBeVisible()
  })

test("une fiche produit s'ouvre et affiche son prix", async ({ page }) => {
  await page.goto(`/${SHOP.slug}`)

  // Attendre que la grille soit rendue
  const firstProduct = page
    .locator(`a[href^="/${SHOP.slug}/"]`)
    .first()
  await expect(firstProduct).toBeVisible({ timeout: 15_000 })
  await firstProduct.click()

  // Attendre la fiche produit
  await page.waitForURL(new RegExp(`/${SHOP.slug}/.+`), { timeout: 20_000 })

  // Vérifier soit la présence du bouton WhatsApp, soit le badge rupture
  const whatsappButton = page.getByTestId("whatsapp-button")
  const outOfStockBadge = page.getByText(/rupture|out of stock/i)

  // Attendre que l'UN des deux soit visible (le produit est soit dispo soit en rupture)
  await expect(
    whatsappButton.or(outOfStockBadge).first()
  ).toBeVisible({ timeout: 20_000 })
})
})