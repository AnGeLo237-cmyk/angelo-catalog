"use server"

import { createClient } from "@/lib/supabase/server"
import { trackEvent } from "@/lib/analytics/track-event"

export async function trackWhatsAppClick(
  shopId: string,
  productId: string | null
): Promise<void> {
  // Vérification minimale : la boutique existe et est active
  const supabase = await createClient()
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("id", shopId)
    .eq("is_active", true)
    .maybeSingle()

  if (!shop) return

  await trackEvent("whatsapp_click", shopId, productId)
}