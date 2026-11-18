// =============================================================================
// VISITEUR — Checkout via WhatsApp (avec interception de window.open)
// -----------------------------------------------------------------------------
// On stub `window.open` avant navigation pour capturer l'URL wa.me au lieu
// d'ouvrir un vrai onglet. On vérifie ensuite que l'URL contient le numéro
// et le message de récapitulatif.
// =============================================================================

import { test, expect } from "@playwright/test"
import { SHOP } from "../fixtures"

test.describe("Checkout WhatsApp", () => {
  test("le récapitulatif est envoyé sur WhatsApp", async ({ page }) => {
    // Stub window.open AVANT toute navigation
    await page.addInitScript(() => {
      ;(window as unknown as { __openedUrls: string[] }).__openedUrls = []
      const orig = window.open
      window.open = function (url: string | URL) {
        ;(
          window as unknown as { __openedUrls: string[] }
        ).__openedUrls.push(String(url))
        return null as unknown as Window
      } as typeof window.open
      void orig
    })

    await page.goto(`/${SHOP.slug}`)

    // Ajouter un produit
    await page
      .getByRole("button", { name: /ajouter au panier|add to cart/i })
      .first()
      .click()

    // Ouvrir le panier
    await page
      .getByRole("button", { name: /ouvrir le panier|open cart/i })
      .first()
      .click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Cliquer sur "Envoyer sur WhatsApp"
    await dialog
      .getByRole("button", { name: /envoyer sur whatsapp|send on whatsapp/i })
      .click()

    // Attendre que window.open ait été appelé (poll)
    await expect
      .poll(
        async () => {
          return await page.evaluate(() => {
            const w = window as unknown as { __openedUrls?: string[] }
            return w.__openedUrls?.length ?? 0
          })
        },
        { timeout: 10_000 }
      )
      .toBeGreaterThan(0)

    // Récupérer l'URL capturée
    const urls = await page.evaluate(() => {
      const w = window as unknown as { __openedUrls?: string[] }
      return w.__openedUrls ?? []
    })

    expect(urls).toHaveLength(1)
    expect(urls[0]).toContain("wa.me/")

    const decoded = decodeURIComponent(urls[0])
    // Le message contient "Récapitulatif de commande" (FR) ou "Order summary" (EN)
    expect(decoded).toMatch(/récapitulatif de commande|order summary/i)
    // Et le nom de la boutique
    expect(decoded.length).toBeGreaterThan(50)
  })
})