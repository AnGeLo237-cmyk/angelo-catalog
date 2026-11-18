// =============================================================================
// PAGE CATÉGORIES — Server Component
// -----------------------------------------------------------------------------
// Charge les catégories de la boutique de l'utilisateur, avec le nombre
// de produits associés pour affichage informatif.
// =============================================================================

import { connection } from "next/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CategoriesClient } from "./CategoriesClient"
import type { Category } from "@/lib/types/shop"

export const instant = false

export default async function CategoriesPage() {
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

  // Charge les catégories triées par position
  const { data: categories } = await supabase
    .from("categories")
    .select("id, shop_id, name, slug, position, created_at")
    .eq("shop_id", shop.id)
    .order("position", { ascending: true })

  // Compte les produits par catégorie (une seule requête)
  const { data: productCounts } = await supabase
    .from("products")
    .select("category_id")
    .eq("shop_id", shop.id)
    .not("category_id", "is", null)

  const countMap = new Map<string, number>()
  for (const p of productCounts ?? []) {
    if (p.category_id) {
      countMap.set(p.category_id, (countMap.get(p.category_id) ?? 0) + 1)
    }
  }

  const enriched: Category[] = (categories ?? []).map((c) => ({
    ...c,
    product_count: countMap.get(c.id) ?? 0,
  }))

  return <CategoriesClient categories={enriched} />
}