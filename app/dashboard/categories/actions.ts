// =============================================================================
// SERVER ACTIONS — CATÉGORIES
// -----------------------------------------------------------------------------
// Quatre actions, toutes protégées par getOwnedShopId() et vérifiant
// les lignes affectées (correctif `.select("id")` comme pour les paramètres).
//
// Créer : slug généré automatiquement à partir du nom, unicité par boutique.
// Modifier : régénère le slug si le nom change (peut échouer sur doublon).
// Supprimer : laisse les produits sans catégorie (ON DELETE SET NULL en base).
// Réordonner : N updates séquentiels, acceptable pour <50 catégories.
// =============================================================================

"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { generateUniqueSlug } from "@/lib/slug/generate-unique-slug"
import { validateCategoryInput } from "@/lib/validation/category"

type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string }

async function getOwnedShopId(): Promise<
  { shopId: string } | { error: string }
> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    return { error: "Session expirée ou invalide. Reconnectez-vous." }
  }
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

// ---------------------------------------------------------------------------
// Créer
// ---------------------------------------------------------------------------
export async function createCategory(formData: FormData): Promise<ActionResult> {
  const validation = validateCategoryInput(formData)
  if (!validation.ok || !validation.data) {
    return { success: false, error: "Nom invalide." }
  }

  const owned = await getOwnedShopId()
  if ("error" in owned) return { success: false, error: owned.error }

  const supabase = await createClient()

  // ✅ Vérification EXPLICITE du nom (insensible à la casse)
  if (await nameExists(supabase, owned.shopId, validation.data.name)) {
    return {
      success: false,
      error: "Une catégorie avec ce nom existe déjà.",
    }
  }

  let slug: string
  try {
    slug = await generateUniqueSlug(supabase, validation.data.name, {
      table: "categories",
      shopId: owned.shopId,
    })
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Slug impossible.",
    }
  }

  // Position = max + 1
  const { data: last } = await supabase
    .from("categories")
    .select("position")
    .eq("shop_id", owned.shopId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()

  const position = (last?.position ?? -1) + 1

  const { data, error } = await supabase
    .from("categories")
    .insert({ shop_id: owned.shopId, name: validation.data.name, slug, position })
    .select("id")
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath("/dashboard/categories")
  return { success: true, id: data.id }
}

// ---------------------------------------------------------------------------
// Modifier
// ---------------------------------------------------------------------------
export async function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const validation = validateCategoryInput(formData)
  if (!validation.ok || !validation.data) {
    return { success: false, error: "Nom invalide." }
  }

  const owned = await getOwnedShopId()
  if ("error" in owned) return { success: false, error: owned.error }

  const supabase = await createClient()

  // Vérifier que la catégorie appartient bien à la boutique de l'utilisateur
  const { data: existing, error: readError } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("id", id)
    .eq("shop_id", owned.shopId)
    .maybeSingle()

  if (readError || !existing) {
    return { success: false, error: "Catégorie introuvable." }
  }

  // ✅ Vérification EXPLICITE du nom, en excluant la catégorie elle-même
  if (
    validation.data.name !== existing.name &&
    (await nameExists(supabase, owned.shopId, validation.data.name, id))
  ) {
    return {
      success: false,
      error: "Une catégorie avec ce nom existe déjà.",
    }
  }

  let newSlug = existing.slug
  if (validation.data.name !== existing.name) {
    try {
      newSlug = await generateUniqueSlug(supabase, validation.data.name, {
        table: "categories",
        shopId: owned.shopId,
      })
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Slug impossible.",
      }
    }
  }

  const { data, error } = await supabase
    .from("categories")
    .update({ name: validation.data.name, slug: newSlug })
    .eq("id", id)
    .eq("shop_id", owned.shopId)
    .select("id")

  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) {
    return { success: false, error: "Mise à jour refusée." }
  }

  revalidatePath("/dashboard/categories")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Supprimer
// ---------------------------------------------------------------------------
export async function deleteCategory(id: string): Promise<ActionResult> {
  const owned = await getOwnedShopId()
  if ("error" in owned) return { success: false, error: owned.error }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("shop_id", owned.shopId)
    .select("id")

  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) {
    return { success: false, error: "Suppression refusée ou catégorie introuvable." }
  }

  revalidatePath("/dashboard/categories")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Réordonner
// ---------------------------------------------------------------------------
// Reçoit la liste des IDs dans le nouvel ordre. Applique `position = index`.
// N updates séquentiels : suffisant pour des catalogues <50 catégories.
// Les échecs partiels sont tolérés : le prochain chargement montrera l'état
// réel, et l'utilisateur peut recommencer le drag.
export async function reorderCategories(orderedIds: string[]): Promise<ActionResult> {
  const owned = await getOwnedShopId()
  if ("error" in owned) return { success: false, error: owned.error }

  const supabase = await createClient()

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("categories")
      .update({ position: i })
      .eq("id", orderedIds[i])
      .eq("shop_id", owned.shopId)
    if (error) return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/categories")
  return { success: true }
}

// Helper : vérifie qu'aucune catégorie n'a déjà ce nom (insensible à la casse)
// dans la même boutique. Le paramètre `excludeId` permet de ne pas se
// comparer à soi-même lors d'une modification.
async function nameExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shopId: string,
  name: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shopId)
    .ilike("name", name) // ilike = case-insensitive

  if (excludeId) query = query.neq("id", excludeId)

  const { count, error } = await query
  if (error) throw new Error(error.message)
  return (count ?? 0) > 0
}