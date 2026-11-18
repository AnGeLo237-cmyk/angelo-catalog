// =============================================================================
// SERVER ACTION — prepareCheckout
// -----------------------------------------------------------------------------
// Refetch les produits du panier pour garantir la fraîcheur :
//   - Filtre les produits dépubliés/supprimés de la boutique
//   - Détecte les changements de prix
//   - Ajuste les quantités si le stock a diminué
//
// Retourne TOUT ce dont le client a besoin pour :
//   1. Afficher une modal de confirmation si changements
//   2. Générer le message WhatsApp avec les données à jour
//   3. Tracker l'événement checkout_whatsapp
//
// Le client reste responsable de générer le message (buildInvoiceMessage)
// pour garder le serveur agnostique de la locale et de la note.
// =============================================================================

"use server"

import { createClient } from "@/lib/supabase/server"
import type { Currency } from "@/lib/types/shop"

export interface CheckoutItemInput {
  productId: string
  quantity: number
  /** Prix au moment de l'ajout, pour détecter les changements */
  oldPrice: number | null
}

export interface ValidatedCheckoutItem {
  productId: string
  slug: string
  name: string
  price: number | null
  currency: Currency
  /** Quantité finale (cappée au stock actuel si besoin) */
  quantity: number
}

export interface CheckoutResult {
  shopId: string
  shopName: string
  whatsappNumber: string
  validatedItems: ValidatedCheckoutItem[]
  unavailable: string[]
  priceChanged: Array<{
    productId: string
    productName: string
    oldPrice: number | null
    newPrice: number | null
  }>
  stockAdjusted: Array<{
    productId: string
    productName: string
    requestedQty: number
    availableQty: number
  }>
}

type ActionResult =
  | { ok: true; data: CheckoutResult }
  | { ok: false; error: string }

const MAX_ITEMS = 20
const MAX_QTY = 99

export async function prepareCheckout(
  shopSlug: string,
  items: CheckoutItemInput[]
): Promise<ActionResult> {
  // --- Validation basique --------------------------------------------------
  if (!shopSlug || typeof shopSlug !== "string") {
    return { ok: false, error: "Boutique invalide." }
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Panier vide." }
  }
  if (items.length > MAX_ITEMS) {
    return { ok: false, error: `Maximum ${MAX_ITEMS} articles.` }
  }

  const supabase = await createClient()

  // --- Boutique -----------------------------------------------------------
  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, whatsapp_number")
    .eq("slug", shopSlug)
    .eq("is_active", true)
    .maybeSingle()

  if (!shop) {
    return { ok: false, error: "Boutique introuvable ou inactive." }
  }

  // --- Produits ------------------------------------------------------------
  const productIds = items.map((i) => i.productId)

  const { data: products } = await supabase
    .from("products")
    .select("id, slug, name, price, currency, stock, status")
    .eq("shop_id", shop.id)
    .eq("status", "published")
    .in("id", productIds)

  const productMap = new Map(
    (products ?? []).map((p) => [p.id, p])
  )

  const validatedItems: ValidatedCheckoutItem[] = []
  const unavailable: string[] = []
  const priceChanged: CheckoutResult["priceChanged"] = []
  const stockAdjusted: CheckoutResult["stockAdjusted"] = []

  for (const input of items) {
    const product = productMap.get(input.productId)

    // Produit absent (supprimé, dépublié, ou appartient à une autre boutique)
    if (!product) {
      unavailable.push(input.productId)
      continue
    }

    // Rupture de stock totale
    if (product.stock !== null && product.stock <= 0) {
      unavailable.push(input.productId)
      continue
    }

    // Prix modifié ?
    if (product.price !== input.oldPrice) {
      priceChanged.push({
        productId: product.id,
        productName: product.name,
        oldPrice: input.oldPrice,
        newPrice: product.price,
      })
    }

    // Quantité ajustée au stock actuel
    let qty = Math.min(Math.max(1, input.quantity), MAX_QTY)
    if (product.stock !== null) {
      const maxQty = Math.min(product.stock, MAX_QTY)
      if (qty > maxQty) {
        stockAdjusted.push({
          productId: product.id,
          productName: product.name,
          requestedQty: qty,
          availableQty: maxQty,
        })
        qty = maxQty
      }
    }

    validatedItems.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      currency: product.currency as Currency,
      quantity: qty,
    })
  }

  // Plus rien de disponible
  if (validatedItems.length === 0) {
    return { ok: false, error: "Aucun article disponible. Votre panier est obsolète." }
  }

  return {
    ok: true,
    data: {
      shopId: shop.id,
      shopName: shop.name,
      whatsappNumber: shop.whatsapp_number,
      validatedItems,
      unavailable,
      priceChanged,
      stockAdjusted,
    },
  }
}