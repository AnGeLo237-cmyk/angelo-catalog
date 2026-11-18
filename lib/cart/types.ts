// =============================================================================
// TYPES — PANIER
// -----------------------------------------------------------------------------
// Le panier est un objet immuable (reducer). Chaque produit est une ligne
// distincte, ordonnée par ajout. Une seule devise par panier : imposée dès
// le 1ᵉʳ ajout, vérifiée à chaque ajout suivant.
//
// `stock` est capturé au moment de l'ajout pour borner la quantité. Il sera
// revérifié côté serveur en phase C (refetch avant envoi WhatsApp).
// =============================================================================

import type { Currency } from "@/lib/types/shop"

export const CART_MAX_LINES = 20
export const CART_MAX_QUANTITY = 99
export const CART_STORAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

/** Données d'un produit nécessaires pour l'ajouter au panier (client) */
export interface ProductForCart {
  productId: string
  slug: string
  name: string
  price: number | null
  currency: Currency
  imageUrl: string | null
  /** null = stock non suivi → quantité plafonnée à CART_MAX_QUANTITY */
  stock: number | null
}

/** Ligne du panier */
export interface CartItem {
  productId: string
  slug: string
  name: string
  price: number | null
  currency: Currency
  imageUrl: string | null
  stock: number | null
  quantity: number
  /** Date d'ajout (ms epoch) — sert à stabiliser l'ordre d'affichage */
  addedAt: number
}

/** État complet du panier */
export interface CartState {
  shopSlug: string
  items: CartItem[]
  currency: Currency | null
  /** Note libre du client (livraison, personnalisation…). Persistée avec le panier. */
  note: string
  updatedAt: number
}

/** Actions du reducer — union discriminée */
export type CartAction =
  | { type: "HYDRATE"; state: CartState }
  | { type: "ADD_ITEM"; item: ProductForCart; quantity: number; now: number }
  | { type: "REMOVE_ITEM"; productId: string; now: number }
  | { type: "SET_QUANTITY"; productId: string; quantity: number; now: number }
  | { type: "SET_NOTE"; note: string; now: number }
  | { type: "CLEAR"; now: number }

/** Résultat d'une tentative d'ajout (pour l'UI) */
export type AddResult =
  | { ok: true; cappedQuantity?: number }
  | { ok: false; error: CartError }

export type CartError =
  | "currency_mismatch"
  | "max_lines_reached"
  | "out_of_stock"
  | "invalid_quantity"

/** Utilitaire : état vide pour une boutique */
export function createEmptyCart(shopSlug: string): CartState {
  return { shopSlug, items: [], currency: null, note: "", updatedAt: 0 }
}