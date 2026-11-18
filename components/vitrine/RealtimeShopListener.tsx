// =============================================================================
// REALTIME SHOP LISTENER — Écoute les changements de la boutique
// -----------------------------------------------------------------------------
// Comportement :
//   1. S'abonne aux changements de `products` (et `product_images` si productId)
//   2. Incrémente un compteur à chaque événement
//   3. Affiche une pilule flottante « X mises à jour disponibles »
//   4. Sur clic : router.refresh() + reset du compteur
//
// ⚠️ RLS est respecté automatiquement par Supabase Realtime : un visiteur
//    anonyme ne reçoit que les événements des produits publiés de boutiques
//    actives. On n'a pas besoin de filtrer côté client.
//
// ⚠️ Le composant gère son propre cycle de vie : souscription au montage,
//    nettoyage au démontage. Si le shopId change (navigation), la souscription
//    est recréée.
// =============================================================================

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { createClient } from "@/lib/supabase/client"

interface RealtimeShopListenerProps {
  /** ID de la boutique (filtre principal) */
  shopId: string
  /**
   * Si fourni, on filtre aussi sur ce produit spécifique (page produit).
   * Sinon, on écoute tous les produits de la boutique (page liste).
   */
  productId?: string
}

export function RealtimeShopListener({
  shopId,
  productId,
}: RealtimeShopListenerProps) {
  const t = useTranslations("vitrine.realtime")
  const router = useRouter()
  const [count, setCount] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Nom de canal unique par contexte pour éviter les collisions si
    // plusieurs instances cohabitent (page liste + page produit).
    const channelName = productId
      ? `shop-${shopId}-product-${productId}`
      : `shop-${shopId}-list`

    // Filtre :
    //   - page liste : tous les produits de la boutique
    //   - page produit : uniquement le produit courant
    const productFilter = productId
      ? `id=eq.${productId}`
      : `shop_id=eq.${shopId}`

    let channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: productFilter,
        },
        () => {
          setCount((c) => c + 1)
        }
      )

    // Sur page produit, on écoute aussi les images du produit courant
    // (ajout, suppression, réorganisation). Sur la page liste, on ne
    // peut pas filtrer product_images par shop_id (colonne absente),
    // donc on s'abstient — les changements d'images y sont rares et
    // apparaîtront au prochain refresh manuel.
    if (productId) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_images",
          filter: `product_id=eq.${productId}`,
        },
        () => {
          setCount((c) => c + 1)
        }
      )
    }

    channel.subscribe()

    // Nettoyage : ferme le WebSocket au démontage ou si shopId change
    return () => {
      supabase.removeChannel(channel)
    }
  }, [shopId, productId])

  function handleRefresh() {
    setIsRefreshing(true)
    setCount(0)
    router.refresh()
    // Petit délai avant de réactiver le bouton : le refresh est rapide,
    // mais on évite les clics multiples pendant la transition.
    setTimeout(() => setIsRefreshing(false), 600)
  }

  if (count === 0 && !isRefreshing) return null

  // Affichage plafonné : au-delà de 9, on affiche « 9+ » pour ne pas
  // déformer la pilule si le commerçant fait 50 modifications d'un coup.
  const displayCount = count > 9 ? "9+" : String(count)

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-fade-in-up"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full
                   bg-on-surface text-surface shadow-lg
                   hover:bg-on-surface/90 hover:shadow-xl
                   disabled:opacity-70 disabled:cursor-wait
                   transition-all"
        aria-live="polite"
      >
        {/* Point animé : signal visuel de « nouvelle activité » */}
        <span
          className="w-2 h-2 rounded-full bg-primary animate-pulse"
          aria-hidden="true"
        />

        <span className="text-sm font-medium">
          {isRefreshing
            ? t("refreshing")
            : t("updatesAvailable", { count: displayCount })}
        </span>

        <span
          className="border-l border-surface/20 pl-2 ml-1 text-xs opacity-80 inline-flex items-center gap-1"
          aria-hidden="true"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
          {t("refresh")}
        </span>
      </button>
    </div>
  )
}