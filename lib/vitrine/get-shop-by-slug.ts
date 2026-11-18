// =============================================================================
// REQUÊTES ANON POUR LA VITRINE
// -----------------------------------------------------------------------------
// Toutes ces fonctions utilisent le client navigateur/serveur `anon`.
// RLS filtre automatiquement : un visiteur ne voit que les boutiques actives
// et les produits publiés.
// =============================================================================

import { createClient } from "@/lib/supabase/server"
import type { Product, ProductImage } from "@/lib/types/shop"

const NEW_PRODUCT_THRESHOLD_DAYS = 14

function computeIsNew(createdAt: string): boolean {
  const thresholdMs = NEW_PRODUCT_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
  return Date.now() - new Date(createdAt).getTime() < thresholdMs
}

export interface PublicShop {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  whatsapp_number: string
  contact_email: string | null
  language: "fr" | "en"
  theme_mode: "light" | "dark" | "system"
  primary_color: string
  catalog_layout: "grid-2" | "grid-3" | "grid-4" | "list"
  created_at: string
  updated_at: string  // ← ajout
}

export interface PublicProduct extends Product {
  category_name: string | null
  images: Array<{ id: string; public_url: string; alt_text: string | null }>
  /** Produit créé il y a moins de 14 jours — calculé côté serveur */
  is_new: boolean
}

/**
 * Enrichit une liste de produits bruts avec :
 *   - le nom de leur catégorie
 *   - leurs images résolues (URL publique)
 *   - le flag is_new
 */
async function enrichProducts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  products: Product[]
): Promise<PublicProduct[]> {
  if (products.length === 0) return []

  const productIds = products.map((p) => p.id)

  // Récupère toutes les images et catégories en parallèle
  const [{ data: images }, { data: categories }] = await Promise.all([
    supabase
      .from("product_images")
      .select("id, product_id, storage_path, alt_text, position")
      .in("product_id", productIds)
      .order("position", { ascending: true }),
    supabase
      .from("categories")
      .select("id, name")
      .in("id", products.map((p) => p.category_id).filter(Boolean) as string[]),
  ])

  const catMap = new Map<string, string>(
    (categories ?? []).map((c) => [c.id, c.name])
  )
  const imageMap = new Map<
    string,
    Array<{ id: string; public_url: string; alt_text: string | null }>
  >()

  for (const img of (images ?? []) as ProductImage[]) {
    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(img.storage_path)
    const arr = imageMap.get(img.product_id) ?? []
    arr.push({ id: img.id, public_url: data.publicUrl, alt_text: img.alt_text })
    imageMap.set(img.product_id, arr)
  }

  return products.map((p) => ({
    ...p,
    category_name: p.category_id ? catMap.get(p.category_id) ?? null : null,
    images: imageMap.get(p.id) ?? [],
    is_new: computeIsNew(p.created_at),
  }))
}

export async function getShopBySlug(slug: string): Promise<PublicShop | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("shops")
    .select(
      "id, name, slug, description, logo_url, whatsapp_number, contact_email, language, theme_mode, primary_color, catalog_layout, created_at, updated_at"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()
  return data
}

export async function getShopCategories(shopId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, position")
    .eq("shop_id", shopId)
    .order("position", { ascending: true })
  return data ?? []
}

export async function getShopProducts(shopId: string): Promise<PublicProduct[]> {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shopId)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })

  return enrichProducts(supabase, (products ?? []) as Product[])
}

export async function getProductBySlug(
  shopId: string,
  productSlug: string
): Promise<PublicProduct | null> {
  const supabase = await createClient()
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shopId)
    .eq("slug", productSlug)
    .eq("status", "published")
    .maybeSingle()

  if (!product) return null

  const enriched = await enrichProducts(supabase, [product as Product])
  return enriched[0] ?? null
}

/**
 * Retourne la date de dernière mise à jour du catalogue :
 * max(shop.updated_at, dernier product.updated_at publié).
 * Null si ni la boutique ni aucun produit n'a été mis à jour depuis création.
 */
export async function getLastCatalogUpdate(shop: PublicShop): Promise<Date | null> {
  const supabase = await createClient()

  const { data: latestProduct } = await supabase
    .from("products")
    .select("updated_at")
    .eq("shop_id", shop.id)
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const shopDate = shop.updated_at ? new Date(shop.updated_at) : null
  const productDate = latestProduct?.updated_at
    ? new Date(latestProduct.updated_at)
    : null

  if (!shopDate) return productDate
  if (!productDate) return shopDate
  return shopDate > productDate ? shopDate : productDate
}

/**
 * Retourne jusqu'à `limit` produits liés au produit courant :
 *   1. Priorité aux produits de la même catégorie
 *   2. Complète avec les produits featured de la boutique si besoin
 *   3. Exclut toujours le produit courant
 */
export async function getRelatedProducts(
  shopId: string,
  categoryId: string | null,
  excludeProductId: string,
  limit = 4
): Promise<PublicProduct[]> {
  const supabase = await createClient()

  // 1. Produits de la même catégorie
  let sameCategory: Product[] = []
  if (categoryId) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("shop_id", shopId)
      .eq("category_id", categoryId)
      .eq("status", "published")
      .neq("id", excludeProductId)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit)
    sameCategory = (data ?? []) as Product[]
  }

  // 2. Compléter avec les featured si pas assez
  let featured: Product[] = []
  if (sameCategory.length < limit) {
    const excludeIds = [excludeProductId, ...sameCategory.map((p) => p.id)]
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("shop_id", shopId)
      .eq("status", "published")
      .eq("is_featured", true)
      .not("id", "in", `(${excludeIds.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(limit - sameCategory.length)
    featured = (data ?? []) as Product[]
  }

  const combined = [...sameCategory, ...featured]
  return enrichProducts(supabase, combined)
}

/**
 * Extrait la première phrase de la description (jusqu'à `.`, `!` ou `?`).
 * Retourne null si la description est vide ou ne produit rien d'utile.
 * Utilisée comme tagline du hero quand on n'a pas de colonne dédiée.
 */
export function extractTagline(description: string | null): string | null {
  if (!description) return null
  const trimmed = description.trim()
  if (!trimmed) return null
  // Match jusqu'au premier . ! ou ? suivi d'un espace ou fin de chaîne
  const match = trimmed.match(/^[^.!?]+[.!?]/)
  const firstSentence = (match ? match[0] : trimmed).trim()
  // Si la première phrase est trop courte, prendre toute la description
  return firstSentence.length < 10 ? trimmed : firstSentence
}

/**
 * Cherche une image de couverture pour le hero :
 *   - 1ʳᵉ image du 1ᵉʳ produit featured publié (position 0)
 *   - Fallback : 1ʳᵉ image du produit publié le plus récent
 *   - Retourne null si aucun produit n'a d'image
 *
 * Pur utilité visuelle — aucune donnée métier ne dépend de ce résultat.
 */
export async function getShopCoverImage(
  shopId: string
): Promise<string | null> {
  const supabase = await createClient()

  // 1. Cherche un produit featured avec au moins une image
  const { data: featured } = await supabase
    .from("products")
    .select("id")
    .eq("shop_id", shopId)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // 2. Fallback : produit publié le plus récent
  let productId = featured?.id
  if (!productId) {
    const { data: latest } = await supabase
      .from("products")
      .select("id")
      .eq("shop_id", shopId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    productId = latest?.id
  }

  if (!productId) return null

  // 3. Récupère la 1ʳᵉ image (position 0) de ce produit
  const { data: image } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", productId)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!image) return null

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(image.storage_path)
  return data.publicUrl
}

/**
 * Retourne les produits featured publiés, hors IDs exclus.
 * Utilisé pour la section « Coups de cœur » du hero de page d'accueil.
 */
export async function getFeaturedProducts(
  shopId: string,
  excludeIds: string[],
  limit = 4
): Promise<PublicProduct[]> {
  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select("*")
    .eq("shop_id", shopId)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`)
  }

  const { data } = await query
  return enrichProducts(supabase, (data ?? []) as Product[])
}