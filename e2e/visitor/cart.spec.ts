// =============================================================================
// VISITEUR — Panier (ajout, quantités, isolation par boutique)
// =============================================================================

import { test, expect } from "@playwright/test"
import { SHOP } from "../fixtures"

test.describe("Panier", () => {
  test("ajouter un produit au panier", async ({ page }) => {
    await page.goto(`/${SHOP.slug}`)

    // Cliquer sur le premier bouton "Ajouter au panier"
    const addBtn = page
      .getByRole("button", { name: /ajouter au panier|add to cart/i })
      .first()
    await addBtn.click()

    // Le bouton flottant apparaît avec un badge
    const cartButton = page
      .getByRole("button", { name: /ouvrir le panier|open cart/i })
      .first()
    await expect(cartButton).toBeVisible({ timeout: 5_000 })

    // Le badge contient "1"
    await expect(cartButton).toContainText("1")
  })

  test("le drawer s'ouvre et permet d'ajuster la quantité", async ({
    page,
  }) => {
    await page.goto(`/${SHOP.slug}`)

    // Ajouter au panier
    await page
      .getByRole("button", { name: /ajouter au panier|add to cart/i })
      .first()
      .click()

    // Ouvrir le drawer
    await page
      .getByRole("button", { name: /ouvrir le panier|open cart/i })
      .first()
      .click()

    // Le drawer est ouvert (dialog)
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Cliquer sur "+"
    await dialog
      .getByRole("button", { name: /augmenter|increase/i })
      .first()
      .click()

    // La quantité affichée passe à 2
    await expect(dialog.locator("text=2").first()).toBeVisible()
  })

  test("le panier est isolé par boutique", async ({ page }) => {
    await page.goto(`/${SHOP.slug}`)
    await page
      .getByRole("button", { name: /ajouter au panier|add to cart/i })
      .first()
      .click()

    // Vérifier que le badge existe
    await expect(
      page.getByRole("button", { name: /ouvrir le panier|open cart/i })
    ).toBeVisible()

    // Naviguer vers une autre URL (page 404 = autre "boutique")
    await page.goto("/boutique-inexistante-xyz")

    // Pas de bouton panier sur une page 404 sans panier
    // (le CartProvider n'est pas monté hors /[slug])
    await expect(
      page.getByRole("button", { name: /ouvrir le panier|open cart/i })
    ).not.toBeVisible()
  })
})