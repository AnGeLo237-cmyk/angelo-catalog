// =============================================================================
// SERVER ACTIONS — DEMANDES DE CONTACT (PUBLIC)
// -----------------------------------------------------------------------------
// Action PUBLIQUE (pas d'auth requise) : n'importe quel visiteur peut envoyer
// une demande, mais on valide strictement (shop actif, produit appartient
// bien à ce shop) pour éviter le spam cross-tenant.
//
// Utilise le client `anon` : RLS filtre automatiquement.
// =============================================================================

"use server"

import { createClient } from "@/lib/supabase/server"
import { validateInquiryInput } from "@/lib/validation/inquiry"
import { trackEvent } from "@/lib/analytics/track-event"

type ActionResult = { success: true } | { success: false; error: string }

export async function createInquiry(
  shopId: string,
  productId: string | null,
  formData: FormData
): Promise<ActionResult> {
  // 1. Validation des champs
  const validation = validateInquiryInput(formData)
  if (!validation.ok || !validation.data) {
    return { success: false, error: "Champs invalides." }
  }
  const input = validation.data
  const sessionId = String(formData.get("session_id") ?? "").trim() || null
  const supabase = await createClient()

  // 2. Vérifier que la boutique existe et est active
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("id", shopId)
    .eq("is_active", true)
    .maybeSingle()

  if (!shop) {
    return { success: false, error: "Boutique introuvable ou inactive." }
  }

  // 3. Vérifier que le produit (si fourni) appartient bien à cette boutique
  if (productId) {
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("shop_id", shopId)
      .eq("status", "published")
      .maybeSingle()

    if (!product) {
      return { success: false, error: "Produit introuvable." }
    }
  }

  // 4. Insertion
  const { error } = await supabase.from("inquiries").insert({
    shop_id: shopId,
    product_id: productId,
    sender_name: input.sender_name,
    sender_email: input.sender_email,
    sender_phone: input.sender_phone,
    message: input.message,
  })

  if (error) {
    return { success: false, error: "Envoi impossible. Réessayez." }
  }

  // 5. Tracking avec session_id
  await supabase.from("analytics_events").insert({
    shop_id: shopId,
    product_id: productId,
    event_type: "contact_submit",
    session_id: sessionId,
  })

  return { success: true }
}