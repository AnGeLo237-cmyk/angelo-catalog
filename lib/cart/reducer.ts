// =============================================================================
// REDUCER — PANIER
// -----------------------------------------------------------------------------
// Fonction pure. Aucun accès à localStorage, Date.now() ou autre effet
// de bord : `now` est passé dans chaque action pour rester déterministe
// et testable.
//
// Invariants maintenus :
//   - Une seule devise dans `currency` (toutes les lignes ont la même)
//   - Max CART_MAX_LINES lignes distinctes
//   - Chaque quantité ∈ [1, min(stock, CART_MAX_QUANTITY)] (ou [1, 99] si stock null)
//   - `items` trié par `addedAt` croissant
// =============================================================================

import {
  CART_MAX_LINES,
  CART_MAX_QUANTITY,
  createEmptyCart,
  type CartAction,
  type CartItem,
  type CartState,
  type ProductForCart,
} from "./types"

/** Borne haute de la quantité d'une ligne */
export function maxQuantityFor(stock: number | null): number {
  if (stock === null) return CART_MAX_QUANTITY
  return Math.min(stock, CART_MAX_QUANTITY)
}

/**
 * Valide une tentative d'ajout SANS muter l'état.
 * Retourne un AddResult pour que l'UI puisse afficher un message d'erreur.
 * Si `cappedQuantity` est retourné, c'est que la quantité demandée dépassait
 * le stock ou la limite : on a silencieusement plafonné.
 */
export function canAddItem(
  state: CartState,
  item: ProductForCart,
  quantity: number
): { ok: true; cappedQuantity: number } | { ok: false; error: string } {
  // Quantité invalide
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, error: "invalid_quantity" }
  }

  // Rupture de stock
  if (item.stock !== null && item.stock <= 0) {
    return { ok: false, error: "out_of_stock" }
  }

  // Devise mixte : si le panier a déjà une devise différente → refus
  if (state.currency && state.currency !== item.currency) {
    return { ok: false, error: "currency_mismatch" }
  }

  const existing = state.items.find((i) => i.productId === item.productId)
  const maxQty = maxQuantityFor(item.stock)

  // Ligne déjà présente : on incrémente, en capant à maxQty
  if (existing) {
    const desired = existing.quantity + quantity
    return { ok: true, cappedQuantity: Math.min(desired, maxQty) }
  }

  // Nouvelle ligne : vérifie la limite de lignes
  if (state.items.length >= CART_MAX_LINES) {
    return { ok: false, error: "max_lines_reached" }
  }

  return { ok: true, cappedQuantity: Math.min(quantity, maxQty) }
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      // Remplace l'état entièrement (utilisé au chargement depuis localStorage)
      return action.state

    case "ADD_ITEM": {
      const item = action.item
      const maxQty = maxQuantityFor(item.stock)

      const existing = state.items.find((i) => i.productId === item.productId)

      if (existing) {
        // ✅ `action.quantity` = DELTA à ajouter.
        //    On additionne à la quantité existante, en capant au stock.
        const nextQty = Math.min(existing.quantity + action.quantity, maxQty)
        if (nextQty <= existing.quantity) {
          // Déjà au maximum — pas de mutation inutile
          return state
        }
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: nextQty, stock: item.stock }
              : i
          ),
          updatedAt: action.now,
        }
      }

      // Nouvelle ligne
      const capped = Math.min(action.quantity, maxQty)
      if (capped <= 0) return state // sécurité

      const newItem: CartItem = {
        productId: item.productId,
        slug: item.slug,
        name: item.name,
        price: item.price,
        currency: item.currency,
        imageUrl: item.imageUrl,
        stock: item.stock,
        quantity: capped,
        addedAt: action.now,
      }
      return {
        ...state,
        currency: state.currency ?? item.currency,
        items: [...state.items, newItem],
        updatedAt: action.now,
      }
    }

    case "REMOVE_ITEM": {
      const nextItems = state.items.filter(
        (i) => i.productId !== action.productId
      )
      return {
        ...state,
        items: nextItems,
        currency: nextItems.length === 0 ? null : state.currency,
        updatedAt: action.now,
      }
    }

    case "SET_QUANTITY": {
      const item = state.items.find((i) => i.productId === action.productId)
      if (!item) return state

      // 0 = suppression
      if (action.quantity <= 0) {
        const nextItems = state.items.filter(
          (i) => i.productId !== action.productId
        )
        return {
          ...state,
          items: nextItems,
          currency: nextItems.length === 0 ? null : state.currency,
          updatedAt: action.now,
        }
      }

      const capped = Math.min(action.quantity, maxQuantityFor(item.stock))
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, quantity: capped } : i
        ),
        updatedAt: action.now,
      }
    }

    case "SET_NOTE":
      return { ...state, note: action.note, updatedAt: action.now } 

    case "CLEAR":
      // Conserve shopSlug (le panier est toujours celui de la boutique)
      return createEmptyCart(state.shopSlug)

    default:
      return state
  }
}