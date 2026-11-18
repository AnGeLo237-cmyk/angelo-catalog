// =============================================================================
// TRACKING CLIENT — Insertion directe dans analytics_events
// -----------------------------------------------------------------------------
// Pas de Server Action : on utilise le client Supabase navigateur.
// RLS autorise `anon` à insérer (politique `Anyone can log analytics events`).
//
// Fire-and-forget : toute erreur est silencieuse pour ne jamais bloquer
// l'expérience utilisateur.
// =============================================================================

"use client"

import { createClient } from "@/lib/supabase/client"
import { getOrCreateSessionId } from "./session"
import type { AnalyticsEventType } from "@/lib/types/shop"

export async function trackEventClient(
  type: AnalyticsEventType,
  shopId: string,
  productId: string | null = null
): Promise<void> {
  try {
    const sessionId = getOrCreateSessionId()
    const supabase = createClient()
    await supabase.from("analytics_events").insert({
      shop_id: shopId,
      product_id: productId,
      event_type: type,
      session_id: sessionId,
    })
  } catch {
    // Silencieux
  }
}

/**
 * Track une vue produit, avec déduplication par onglet-session.
 * Retourne `true` si l'événement a été envoyé, `false` sinon.
 */
export async function trackProductViewOnce(
  shopId: string,
  productId: string
): Promise<boolean> {
  try {
    const key = `viewed_${shopId}_${productId}`
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, "1")
    await trackEventClient("view", shopId, productId)
    return true
  } catch {
    return false
  }
}