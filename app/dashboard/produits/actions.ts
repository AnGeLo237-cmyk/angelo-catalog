// =============================================================================
// SERVER ACTIONS — PRODUITS
// -----------------------------------------------------------------------------
// - createProduct   : slug auto (figé ensuite), via insertWithSlug
// - updateProduct   : le SLUG N'EST PAS RÉGÉNÉRÉ (URL stable)
// - deleteProduct   : suppression définitive
// - togglePublish   : bascule draft <-> published
// - toggleFeatured  : bascule is_featured
//
// Toutes vérifient (a) l'appartenance à la boutique via getOwnedShopId,
// (b) la catégorie si fournie, (c) les lignes affectées via .select("id").
// =============================================================================

"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { insertWithSlug } from "@/lib/slug/insert-with-slug"
import { validateProductInput } from "@/lib/validation/product"

type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string }

async function getOwnedShopId(): Promise<
  { shopId: string } | { error: string }
> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) return { error: "Session expirée ou invalide." }
  if (!user) return { error: "Vous devez être connecté." }

  const { data: shop, error } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle()

  if (error) return { error: "Erreur lors de la récupération de la boutique." }
  if (!shop) return { error: "Boutique introuvable." }
  return { shopId: shop.id }
}

/** Vérifie qu'une catégorie appartient bien à la boutique. */
async function categoryBelongsToShop(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shopId: string,
  categoryId: string
): Promise<boolean> {
  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("id", categoryId)
    .eq("shop_id", shopId)
  return (count ?? 0) > 0
}

// ---------------------------------------------------------------------------
// Créer
// ---------------------------------------------------------------------------
export async function createProduct(formData: FormData): Promise<ActionResult> {
  const validation = validateProductInput(formData)
  if (!validation.ok || !validation.data) {
    return { success: false, error: "Champs invalides." }
  }
  const input = validation.data

  const owned = await getOwnedShopId()
  if ("error" in owned) return { success: false, error: owned.error }

  const supabase = await createClient()

  if (input.category_id) {
    const ok = await categoryBelongsToShop(supabase, owned.shopId, input.category_id)
    if (!ok) return { success: false, error: "Catégorie invalide." }
  }

  // ✅ Anti-doublon de nom dès la création
  try {
    if (await productNameExists(supabase, owned.shopId, input.name)) {
      return { success: false, error: "Un produit avec ce nom existe déjà." }
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Vérification impossible.",
    }
  }

  try {
    const created = await insertWithSlug(supabase, {
      table: "products",
      baseName: input.name,
      shopId: owned.shopId,
      data: {
        shop_id: owned.shopId,
        category_id: input.category_id,
        name: input.name,
        description: input.description,
        price: input.price,
        currency: input.currency,
        stock: input.stock,
        status: input.status,
        is_featured: input.is_featured,
      },
    })

    revalidatePath("/dashboard/produits")
    return { success: true, id: created.id }
  } catch (err) {
    if ((err as { code?: string })?.code === "23505") {
      return { success: false, error: "Un produit avec ce nom existe déjà." }
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Création impossible.",
    }
  }
}

// ---------------------------------------------------------------------------
// Modifier
// ---------------------------------------------------------------------------
// ⚠️ Le slug n'est PAS régénéré : les URLs partagées (WhatsApp) restent valides.
// Seuls nom, description, prix, devise, stock, catégorie, statut et featured
// sont mis à jour.
export async function updateProduct(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  // 1. Validation
  const validation = validateProductInput(formData)
  if (!validation.ok || !validation.data) {
    return { success: false, error: "Champs invalides." }
  }
  const input = validation.data

  // 2. Authentification + boutique
  const owned = await getOwnedShopId()
  if ("error" in owned) return { success: false, error: owned.error }

  const supabase = await createClient()

  // 3. Une seule requête : existence + ownership + nom actuel
  const { data: existing, error: readError } = await supabase
    .from("products")
    .select("id, name")
    .eq("id", id)
    .eq("shop_id", owned.shopId)
    .maybeSingle()

  if (readError || !existing) {
    return { success: false, error: "Produit introuvable." }
  }

  // 4. Catégorie (uniquement si fournie)
  if (input.category_id) {
    const ok = await categoryBelongsToShop(
      supabase,
      owned.shopId,
      input.category_id
    )
    if (!ok) return { success: false, error: "Catégorie invalide." }
  }

  // 5. Anti-doublon — SEULEMENT si le nom change
  //    Comparaison insensible à la casse et aux espaces : une simple édition
  //    de prix/statut sans toucher au nom ne déclenche aucune requête.
  const nameChanged =
    input.name.trim().toLowerCase() !== existing.name.trim().toLowerCase()

  if (nameChanged) {
    try {
      if (await productNameExists(supabase, owned.shopId, input.name, id)) {
        return {
          success: false,
          error: "Un produit avec ce nom existe déjà.",
        }
      }
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error ? err.message : "Vérification impossible.",
      }
    }
  }

  // 6. Mise à jour
  const { data, error } = await supabase
    .from("products")
    .update({
      category_id: input.category_id,
      name: input.name,
      description: input.description,
      price: input.price,
      currency: input.currency,
      stock: input.stock,
      status: input.status,
      is_featured: input.is_featured,
    })
    .eq("id", id)
    .eq("shop_id", owned.shopId)
    .select("id")

  if (error) {
    // Filet de sécurité : si une contrainte unique (shop_id, name) existe
    // un jour en base, on renvoie le message métier au lieu du code SQL brut.
    if (error.code === "23505") {
      return { success: false, error: "Un produit avec ce nom existe déjà." }
    }
    return { success: false, error: error.message }
  }
  if (!data || data.length === 0) {
    return { success: false, error: "Mise à jour refusée." }
  }

  revalidatePath("/dashboard/produits")
  revalidatePath(`/dashboard/produits/${id}/editer`)
  return { success: true }
}

// ---------------------------------------------------------------------------
// Supprimer
// ---------------------------------------------------------------------------
export async function deleteProduct(id: string): Promise<ActionResult> {
  const owned = await getOwnedShopId()
  if ("error" in owned) return { success: false, error: owned.error }

  const supabase = await createClient()

  // 1. Récupérer tous les chemins d'images du produit AVANT suppression
  //    (après, la cascade DB les aura supprimés)
  const { data: images } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", id)

  const paths = (images ?? []).map((img) => img.storage_path)

  // 2. Supprimer les fichiers du storage
  //    Best-effort : si ça échoue, on continue la suppression du produit
  //    (les fichiers deviendront orphelins mais l'utilisateur n'est pas bloqué)
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("product-images")
      .remove(paths)
    if (storageError) {
      console.warn(
        `[deleteProduct] Impossible de supprimer ${paths.length} fichier(s) du storage :`,
        storageError.message
      )
    }
  }

  // 3. Supprimer le produit (cascade sur product_images via FK)
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("shop_id", owned.shopId)
    .select("id")

  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) {
    return { success: false, error: "Suppression refusée ou produit introuvable." }
  }

  revalidatePath("/dashboard/produits")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Publier / dépublier
// ---------------------------------------------------------------------------
export async function togglePublish(id: string): Promise<ActionResult> {
  const owned = await getOwnedShopId()
  if ("error" in owned) return { success: false, error: owned.error }

  const supabase = await createClient()

  // Lire l'état actuel
  const { data: existing, error: readError } = await supabase
    .from("products")
    .select("status")
    .eq("id", id)
    .eq("shop_id", owned.shopId)
    .maybeSingle()

  if (readError || !existing) {
    return { success: false, error: "Produit introuvable." }
  }

  const nextStatus = existing.status === "published" ? "draft" : "published"

  const { data, error } = await supabase
    .from("products")
    .update({ status: nextStatus })
    .eq("id", id)
    .eq("shop_id", owned.shopId)
    .select("id")

  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: "Refusé." }

  revalidatePath("/dashboard/produits")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Mettre en avant
// ---------------------------------------------------------------------------
export async function toggleFeatured(id: string): Promise<ActionResult> {
  const owned = await getOwnedShopId()
  if ("error" in owned) return { success: false, error: owned.error }

  const supabase = await createClient()

  const { data: existing, error: readError } = await supabase
    .from("products")
    .select("is_featured")
    .eq("id", id)
    .eq("shop_id", owned.shopId)
    .maybeSingle()

  if (readError || !existing) {
    return { success: false, error: "Produit introuvable." }
  }

  const { data, error } = await supabase
    .from("products")
    .update({ is_featured: !existing.is_featured })
    .eq("id", id)
    .eq("shop_id", owned.shopId)
    .select("id")

  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: "Refusé." }

  revalidatePath("/dashboard/produits")
  return { success: true }
}

/**
 * Vérifie qu'aucun AUTRE produit de la boutique n'a déjà ce nom
 * (comparaison insensible à la casse via ILIKE).
 * `excludeId` permet de ne pas se comparer à soi-même lors d'une mise à jour.
 */
async function productNameExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shopId: string,
  name: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shopId)
    .ilike("name", name.trim())

  if (excludeId) query = query.neq("id", excludeId)

  const { count, error } = await query
  if (error) throw new Error(error.message)
  return (count ?? 0) > 0
}