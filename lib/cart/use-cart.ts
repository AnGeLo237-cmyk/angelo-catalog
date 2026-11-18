// =============================================================================
// HOOK — useCart
// -----------------------------------------------------------------------------
// Enveloppe le reducer et expose une API orientée usage :
//   - state : l'état courant du panier
//   - hydrated : false pendant le SSR et le premier rendu client, true après
//                chargement depuis localStorage (utile pour éviter les flashs)
//   - addItem(item, qty) → AddResult (permet d'afficher une erreur)
//   - removeItem(productId)
//   - setQuantity(productId, qty)
//   - clear()
//   - helpers : itemCount, subtotal, hasItem, getQuantity
//
// Le hook DOIT être utilisé sous <CartProvider>.
// =============================================================================

"use client"

import { useContext } from "react"
import { CartContext } from "@/components/vitrine/cart/CartProvider"
import type { CartState, ProductForCart, AddResult } from "./types"

export interface UseCartApi {
  state: CartState
  hydrated: boolean
  /** ID de la boutique (pour tracking analytics) */
  shopId: string
  addItem: (item: ProductForCart, quantity?: number) => AddResult
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  setNote: (note: string) => void
  clear: () => void
  itemCount: number
  subtotal: number
  getQuantity: (productId: string) => number
  hasItem: (productId: string) => boolean
}

export function useCart(): UseCartApi {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart doit être utilisé dans un <CartProvider>")
  }
  return ctx
}