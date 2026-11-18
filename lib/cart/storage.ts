// =============================================================================
// STORAGE — Persistance localStorage du panier
// -----------------------------------------------------------------------------
// Clé : `cart_${shopSlug}` → isolation par boutique.
// TTL : 7 jours glissants depuis `updatedAt`. Au-delà, on considère le panier
// comme expiré (retour vide) pour éviter de ressusciter un panier obsolète.
//
// SSR-safe : toutes les fonctions vérifient `typeof window === "undefined"`
// avant d'accéder à localStorage. Le Provider appelle ces fonctions
// uniquement dans un useEffect (côté client).
// =============================================================================

import {
  CART_STORAGE_TTL_MS,
  createEmptyCart,
  type CartState,
} from "./types"

const STORAGE_VERSION = 1

interface StoredCart {
  version: number
  shopSlug: string
  items: CartState["items"]
  currency: CartState["currency"]
  note: string
  updatedAt: number
}

export function storageKeyFor(shopSlug: string): string {
  return `cart_${shopSlug}`
}

export function saveCart(state: CartState): void {
  if (typeof window === "undefined") return
  try {
    const payload: StoredCart = {
      version: STORAGE_VERSION,
      shopSlug: state.shopSlug,
      items: state.items,
      currency: state.currency,
      note: state.note,
      updatedAt: state.updatedAt || Date.now(),
    }
    window.localStorage.setItem(
      storageKeyFor(state.shopSlug),
      JSON.stringify(payload)
    )
  } catch {
    // Quota dépassé, JSON impossible, mode privé Safari… : silencieux
  }
}

export function loadCart(shopSlug: string): CartState {
  if (typeof window === "undefined") return createEmptyCart(shopSlug)
  try {
    const raw = window.localStorage.getItem(storageKeyFor(shopSlug))
    if (!raw) return createEmptyCart(shopSlug)

    const parsed = JSON.parse(raw) as Partial<StoredCart>

    // Version inconnue → on ignore (migration à prévoir si on incrémente)
    if (parsed.version !== STORAGE_VERSION) return createEmptyCart(shopSlug)

    // TTL
    const updatedAt = parsed.updatedAt ?? 0
    if (Date.now() - updatedAt > CART_STORAGE_TTL_MS) {
      clearCart(shopSlug)
      return createEmptyCart(shopSlug)
    }

    // Garde-fou minimal : structure attendue
    if (
      !Array.isArray(parsed.items) ||
      typeof parsed.shopSlug !== "string" ||
      parsed.shopSlug !== shopSlug
    ) {
      return createEmptyCart(shopSlug)
    }

    return {
      shopSlug,
      items: parsed.items,
      currency: parsed.currency ?? null,
      note: typeof parsed.note === "string" ? parsed.note : "",
      updatedAt,
    }
  } catch {
    // Corruption → reset
    return createEmptyCart(shopSlug)
  }
}

export function clearCart(shopSlug: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(storageKeyFor(shopSlug))
  } catch {
    // Silencieux
  }
}