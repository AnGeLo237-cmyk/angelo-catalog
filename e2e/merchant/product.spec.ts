// =============================================================================
// COMMERÇANT — Création de produit + apparition sur la vitrine
// -----------------------------------------------------------------------------
// Principe : la redirection qui SORT de /nouveau est la PREUVE de succès.
// Aucune vérification d'alerte post-redirection n'est nécessaire (les
// composants d'accessibilité utilisent role="alert" sans être des erreurs).
//
// Si la création échoue, on reste sur /nouveau et `waitForURL` timeout —
// le screenshot révèlera alors le message d'erreur du formulaire.
// =============================================================================

import { test, expect } from "@playwright/test"
import { SHOP, uniqueName, tryAdminClient } from "../fixtures"

test.describe("Commerçant — Produits", () => {
  let productName: string

  test.beforeEach(() => {
    productName = uniqueName("Test E2E")
  })

  test.afterEach(async () => {
    const admin = tryAdminClient()
    if (!admin) return
    await admin.from("products").delete().eq("name", productName)
  })

  test("créer un produit publié et le voir sur la vitrine", async ({
    page,
  }) => {
    // --- 1. Formulaire de création ---
    await page.goto("/dashboard/produits/nouveau")
    await page.waitForURL("**/dashboard/produits/nouveau", { timeout: 20_000 })

    // --- 2. Remplir ---
    await page.getByLabel(/nom du produit|product name/i).fill(productName)
    await page.getByLabel(/statut|status/i).selectOption("published")
    await page.getByLabel(/^prix|^price/i).fill("15000")

    // --- 3. Soumettre ---
    await page.getByRole("button", { name: /enregistrer|save/i }).click()

    // --- 4. Attendre la SORTIE de /nouveau (preuve de succès) ---
    //    Si la création échoue, on reste sur /nouveau → timeout → screenshot
    await page.waitForURL(
      (url) => !url.pathname.includes("/nouveau"),
      { timeout: 25_000 }
    )

    // --- 5. Si on est sur l'édition, revenir à la liste ---
    if (page.url().match(/\/editer/)) {
      await page.goto("/dashboard/produits")
    }

    // --- 6. Vérifier la présence dans la liste ---
    await expect(page.getByText(productName).first()).toBeVisible({
      timeout: 15_000,
    })

    // --- 7. Vérifier la présence sur la vitrine publique ---
    await page.goto(`/${SHOP.slug}`, { timeout: 20_000 })
    await expect(page.getByText(productName).first()).toBeVisible({
      timeout: 15_000,
    })
  })
})