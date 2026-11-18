// =============================================================================
// TRACKING ANALYTICS — Serveur uniquement
// -----------------------------------------------------------------------------
// Insère un événement dans `analytics_events` côté serveur (RLS : insertion
// publique autorisée par la politique `Anyone can log analytics events`).
//
// `session_id` est null en Phase 8 (ajouté en Phase 9 via cookie).
// Toutes les erreurs sont avalées : le tracking ne doit JAMAIS casser
// l'expérience utilisateur (fire-and-forget).
// =============================================================================

import { createClient } from "@/lib/supabase/server"
import type { AnalyticsEventType } from "@/lib/types/shop"

export async function trackEvent(
  type: AnalyticsEventType,
  shopId: string,
  productId: string | null = null
): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from("analytics_events").insert({
      shop_id: shopId,
      product_id: productId,
      event_type: type,
      session_id: null,
    })
  } catch (err) {
    // Silencieux : le tracking ne doit jamais bloquer l'utilisateur.
    console.warn("[trackEvent] Échec d'insertion analytics:", err)
  }
}