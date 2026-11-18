// =============================================================================
// PAGE DEMANDES (/dashboard/demandes)
// -----------------------------------------------------------------------------
// Charge toutes les demandes de la boutique, avec le nom du produit lié.
// Passe au Client pour filtres et actions rapides.
// =============================================================================

import { connection } from "next/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DemandesClient } from "./DemandesClient"
import type { InquiryWithProduct } from "@/lib/types/shop"

export const instant = false

export default async function DemandesPage() {
  await connection()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle()
  if (!shop) redirect("/dashboard/onboarding")

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false })

  // Charge les produits référencés pour dénormaliser nom + slug
  const productIds = (inquiries ?? [])
    .map((i) => i.product_id)
    .filter((id): id is string => id !== null)

  const { data: products } = productIds.length > 0
    ? await supabase
        .from("products")
        .select("id, name, slug")
        .in("id", productIds)
    : { data: [] as Array<{ id: string; name: string; slug: string }> }

  const productMap = new Map<string, { name: string; slug: string }>(
    (products ?? []).map((p) => [p.id, { name: p.name, slug: p.slug }])
  )

  const enriched: InquiryWithProduct[] = (inquiries ?? []).map((i) => ({
    ...i,
    product_name: i.product_id ? productMap.get(i.product_id)?.name ?? null : null,
    product_slug: i.product_id ? productMap.get(i.product_id)?.slug ?? null : null,
  }))

  return <DemandesClient inquiries={enriched} />
}