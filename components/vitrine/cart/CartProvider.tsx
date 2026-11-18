// =============================================================================
// CART PROVIDER — Contexte React + persistance localStorage
// -----------------------------------------------------------------------------
// ⚠️ Correctif React 19 :
//   - SUPPRESSION de `stateRef` : les callbacks capturent `state` via
//     useCallback avec [state] en deps. C'est plus simple et 100 % safe.
//     Coût : addItem/getQuantity/hasItem sont recréés à chaque mutation,
//     ce qui est négligeable ici (3 composants consommateurs).
//   - SUPPRESSION de `hydratedRef` : remplacé par `useSyncExternalStore`
//     (pattern canonique pour « sommes-nous côté client ? »).
//     Aucun setState dans un effet, aucune écriture de ref pendant le rendu.
//
// Conséquences :
//   - Pas de persistance tant que `state.updatedAt === 0` (panier vierge).
//     Dès la première mutation (ADD_ITEM, CLEAR, etc.), `updatedAt` devient
//     non-nul et la persistance s'active automatiquement.
//   - L'hydratation charge localStorage dans un useEffect sans setState :
//     le HYDRATE dispatch suffit à synchroniser l'état, la re-render est
//     déclenchée par React.
// =============================================================================

"use client"

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useSyncExternalStore,
} from "react"
import { cartReducer, canAddItem } from "@/lib/cart/reducer"
import {
  clearCart as clearStorage,
  loadCart,
  saveCart,
  storageKeyFor,
} from "@/lib/cart/storage"
import {
  createEmptyCart,
  type AddResult,
  type ProductForCart,
} from "@/lib/cart/types"
import type { UseCartApi } from "@/lib/cart/use-cart"

export const CartContext = createContext<UseCartApi | null>(null)

// -----------------------------------------------------------------------------
// Hydration flag — useSyncExternalStore
// -----------------------------------------------------------------------------
// Retourne `false` en SSR et pendant l'hydratation, `true` une fois côté
// client. Aucun setState, aucun effet. Pattern officiel React pour détecter
// le contexte d'exécution sans mismatch d'hydratation.
const emptySubscribe = () => () => {}

function useIsClientHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,   // snapshot client
    () => false   // snapshot serveur
  )
}

export function CartProvider({
  shopSlug,
  shopId,
  children,
}: {
  shopId: string
  shopSlug: string
  children: React.ReactNode
}) {
  const [state, dispatch] = useReducer(
    cartReducer,
    shopSlug,
    createEmptyCart
  )
  const hydrated = useIsClientHydrated()

  // ---------------------------------------------------------------------------
  // Hydratation depuis localStorage + synchro cross-tab
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const loaded = loadCart(shopSlug)
    if (loaded.items.length > 0) {
      dispatch({ type: "HYDRATE", state: loaded })
    }

    function onStorage(e: StorageEvent) {
      if (e.key !== storageKeyFor(shopSlug)) return
      dispatch({ type: "HYDRATE", state: loadCart(shopSlug) })
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [shopSlug])

  // ---------------------------------------------------------------------------
  // Persistance : uniquement après la première mutation réelle
  // ---------------------------------------------------------------------------
  // `updatedAt === 0` correspond à un panier vierge (initial). Dès qu'une
  // action (ADD_ITEM, CLEAR, HYDRATE…) est dispatchée avec `now`, la valeur
  // devient non-nulle et la persistance s'active.
  useEffect(() => {
    if (state.updatedAt === 0) return
    saveCart(state)
  }, [state])

  // ---------------------------------------------------------------------------
  // API — callbacks avec `state` capturé (pas de ref)
  // ---------------------------------------------------------------------------
  const addItem = useCallback(
    (item: ProductForCart, quantity = 1): AddResult => {
      const check = canAddItem(state, item, quantity)
      if (!check.ok) {
        return { ok: false, error: check.error as never }
      }

      // ✅ `canAddItem` retourne la quantité FINALE (existing + quantity,
      //    cappée au stock). Le reducer attend un DELTA. On calcule donc
      //    le delta réel à ajouter : finalQty - previousQty.
      const existing = state.items.find((i) => i.productId === item.productId)
      const previousQty = existing?.quantity ?? 0
      const delta = check.cappedQuantity - previousQty

      if (delta <= 0) {
        // Déjà au maximum — pas de dispatch inutile
        return { ok: true, cappedQuantity: check.cappedQuantity }
      }

      dispatch({
        type: "ADD_ITEM",
        item,
        quantity: delta,
        now: Date.now(),
      })
      return { ok: true, cappedQuantity: check.cappedQuantity }
    },
    [state]
  )

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: "REMOVE_ITEM", productId, now: Date.now() })
  }, [])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: "SET_QUANTITY", productId, quantity, now: Date.now() })
  }, [])

  const clear = useCallback(() => {
    clearStorage(shopSlug)
    dispatch({ type: "CLEAR", now: Date.now() })
  }, [shopSlug])

  // ---------------------------------------------------------------------------
  // Dérivés
  // ---------------------------------------------------------------------------
  const itemCount = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items]
  )

  const subtotal = useMemo(
    () =>
      state.items.reduce(
        (sum, i) => sum + (i.price ?? 0) * i.quantity,
        0
      ),
    [state.items]
  )

  const getQuantity = useCallback(
    (productId: string) =>
      state.items.find((i) => i.productId === productId)?.quantity ?? 0,
    [state.items]
  )

  const hasItem = useCallback(
    (productId: string) =>
      state.items.some((i) => i.productId === productId),
    [state.items]
  )
  
    const setNote = useCallback((note: string) => {
    dispatch({ type: "SET_NOTE", note, now: Date.now() })
  }, [])

  // ---------------------------------------------------------------------------
  // Contexte
  // ---------------------------------------------------------------------------
  const value: UseCartApi = useMemo(
    () => ({
      state,
      hydrated,
      addItem,
      removeItem,
      setQuantity,
      clear,
      shopId,
      itemCount,
      subtotal,
      setNote,
      getQuantity,
      hasItem,
    }),
    [
      state,
      hydrated,
      addItem,
      removeItem,
      setQuantity,
      clear,
      shopId,
      itemCount,
      subtotal,
      setNote,
      getQuantity,
      hasItem,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}