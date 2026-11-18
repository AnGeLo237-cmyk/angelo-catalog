// =============================================================================
// SERVER ACTIONS — IMAGES PRODUIT
// -----------------------------------------------------------------------------
// - uploadProductImage  : compresse côté client (fait en amont), reçoit un File
//                         déjà compressé, stocke dans product-images/{shopId}/{productId}/{uuid}.webp
// - deleteProductImage  : supprime le fichier du storage PUIS la ligne DB
// - reorderProductImages: met à jour les positions (0 = image principale)
//
// ⚠️ La compression se fait côté client AVANT l'appel. Le Server Action
//    reçoit donc un fichier ~0.5 Mo, bien sous la limite Vercel (~4.5 Mo).
// =============================================================================

"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { MAX_IMAGES_PER_PRODUCT } from "@/lib/validation/product-image"

type ActionResult = { success: true } | { success: false; error: string }

async function getProductOwnership(productId: string): Promise<
  | { ok: true; shopId: string; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) return { ok: false, error: "Session expirée." }
  if (!user) return { ok: false, error: "Vous devez être connecté." }

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle()
  if (!shop) return { ok: false, error: "Boutique introuvable." }

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("shop_id", shop.id)
    .maybeSingle()
  if (!product) return { ok: false, error: "Produit introuvable." }

  return { ok: true, shopId: shop.id, supabase }
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------
export async function uploadProductImage(
  productId: string,
  formData: FormData
): Promise<ActionResult> {
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Fichier manquant." }
  }

  const ownership = await getProductOwnership(productId)
  if (!ownership.ok) return { success: false, error: ownership.error }
  const { shopId, supabase } = ownership

  // Vérifier le quota actuel
  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId)

  if ((count ?? 0) >= MAX_IMAGES_PER_PRODUCT) {
    return {
      success: false,
      error: `Maximum ${MAX_IMAGES_PER_PRODUCT} images par produit.`,
    }
  }

  // Chemin : shopId/productId/uuid.webp
  const filename = `${crypto.randomUUID()}.webp`
  const storagePath = `${shopId}/${productId}/${filename}`

  // 1. Upload vers le storage
  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(storagePath, file, {
      contentType: "image/webp",
      upsert: false,
    })

  if (uploadError) {
    return { success: false, error: uploadError.message }
  }

  // 2. Position : max + 1 (ajout à la fin)
  const { data: last } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()
  const position = (last?.position ?? -1) + 1

  // 3. Insertion en DB
  const { error: insertError } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      storage_path: storagePath,
      position,
      alt_text: null,
    })

  if (insertError) {
    // Rollback : supprimer le fichier du storage pour ne pas laisser d'orphelin
    await supabase.storage.from("product-images").remove([storagePath])
    return { success: false, error: insertError.message }
  }

  revalidatePath(`/dashboard/produits/${productId}/editer`)
  revalidatePath("/dashboard/produits")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Suppression
// ---------------------------------------------------------------------------
export async function deleteProductImage(
  productId: string,
  imageId: string
): Promise<ActionResult> {
  const ownership = await getProductOwnership(productId)
  if (!ownership.ok) return { success: false, error: ownership.error }
  const { supabase } = ownership

  // 1. Récupérer le chemin
  const { data: image } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle()
  if (!image) return { success: false, error: "Image introuvable." }

  // 2. Supprimer du storage
  const { error: storageError } = await supabase.storage
    .from("product-images")
    .remove([image.storage_path])
  if (storageError) {
    return { success: false, error: storageError.message }
  }

  // 3. Supprimer la ligne DB
  const { error: dbError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", productId)
  if (dbError) return { success: false, error: dbError.message }

  revalidatePath(`/dashboard/produits/${productId}/editer`)
  revalidatePath("/dashboard/produits")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Réorganisation
// ---------------------------------------------------------------------------
export async function reorderProductImages(
  productId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  const ownership = await getProductOwnership(productId)
  if (!ownership.ok) return { success: false, error: ownership.error }
  const { supabase } = ownership

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("product_images")
      .update({ position: i })
      .eq("id", orderedIds[i])
      .eq("product_id", productId)
    if (error) return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/produits/${productId}/editer`)
  revalidatePath("/dashboard/produits")
  return { success: true }
}