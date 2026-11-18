// =============================================================================
// AGRÉGATIONS SERVEUR — Appels aux RPC
// -----------------------------------------------------------------------------
// Toutes les RPC sont en SECURITY INVOKER : la RLS du caller s'applique.
// Un commerçant ne peut donc récupérer que les stats de SA boutique,
// même si le shop_id passé était falsifié (0 ligne retournée).
// =============================================================================

import { createClient } from "@/lib/supabase/server"
import type {
  AnalyticsSummary,
  DailyAnalytics,
  TopProduct,
} from "@/lib/types/analytics"

export async function getAnalyticsSummary(
  shopId: string,
  days: number
): Promise<AnalyticsSummary> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_analytics_summary", {
    p_shop_id: shopId,
    p_days: days,
  })

  if (error || !data) {
    return { total_views: 0, total_whatsapp_clicks: 0, total_inquiries: 0 }
  }
  return data as AnalyticsSummary
}

export async function getDailyAnalytics(
  shopId: string,
  days: number
): Promise<DailyAnalytics[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_daily_analytics", {
    p_shop_id: shopId,
    p_days: days,
  })

  if (error || !data) return []
  return data as DailyAnalytics[]
}

export async function getTopProducts(
  shopId: string,
  days: number,
  limit = 5
): Promise<TopProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_top_products", {
    p_shop_id: shopId,
    p_days: days,
    p_limit: limit,
  })

  if (error || !data) return []
  return data as TopProduct[]
}