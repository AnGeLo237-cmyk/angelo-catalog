// =============================================================================
// TRACK VIEW — Envoie un événement 'view' au montage (une fois par onglet)
// -----------------------------------------------------------------------------
// Composant invisible, monté sur la page produit. Pas de rendu visuel.
// Déduplication via sessionStorage dans trackProductViewOnce.
// =============================================================================

"use client"

import { useEffect } from "react"
import { trackProductViewOnce } from "@/lib/analytics/track-client"

export function TrackView({
  shopId,
  productId,
}: {
  shopId: string
  productId: string
}) {
  useEffect(() => {
    trackProductViewOnce(shopId, productId)
  }, [shopId, productId])

  return null
}