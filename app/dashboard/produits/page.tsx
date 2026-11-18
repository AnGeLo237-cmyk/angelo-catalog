// =============================================================================
// PAGE PRODUITS — Server Component
// -----------------------------------------------------------------------------
// Chargement en 2 étapes :
//   1. Produits + catégories en parallèle
//   2. Images des produits (nécessite les IDs issus de l'étape 1)
//
// Cette séparation est OBLIGATOIRE : la requête `product_images` a besoin
// des IDs de produits, qui n'existent pas encore dans la même promesse.
// =============================================================================

import { connection } from "next/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProduitsClient } from "./ProduitsClient"
import type { Category, ProductWithCategory, Product } from "@/lib/types/shop"

export const instant = false

export default async function ProduitsPage() {
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

  // --- Étape 1 : produits + catégories en parallèle ------------------------
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, shop_id, name, slug, position, created_at")
      .eq("shop_id", shop.id)
      .order("position", { ascending: true }),
  ])

  // --- Étape 2 : images principales (une seule requête) -------------------
  // On récupère toutes les images des produits de la boutique, triées par
  // position. La première image rencontrée par produit (position 0) est
  // retenue comme image principale.
  const productIds = (products ?? []).map((p) => p.id)

  const { data: allImages } = productIds.length > 0
    ? await supabase
        .from("product_images")
        .select("product_id, storage_path, position")
        .in("product_id", productIds)
        .order("position", { ascending: true })
    : { data: [] as Array<{ product_id: string; storage_path: string; position: number }> }

  const mainImageMap = new Map<string, string>()
  for (const img of allImages ?? []) {
    if (!mainImageMap.has(img.product_id)) {
      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(img.storage_path)
      mainImageMap.set(img.product_id, data.publicUrl)
    }
  }

  // --- Dénormalisation : catégorie + image principale ---------------------
  const catMap = new Map<string, string>(
    (categories ?? []).map((c) => [c.id, c.name])
  )

  const enriched: ProductWithCategory[] = ((products ?? []) as Product[]).map((p) => ({
    ...p,
    category_name: p.category_id ? catMap.get(p.category_id) ?? null : null,
    main_image_url: mainImageMap.get(p.id) ?? null,
  }))

  return (
    <ProduitsClient
      products={enriched}
      categories={(categories ?? []) as Category[]}
    />
  )
}