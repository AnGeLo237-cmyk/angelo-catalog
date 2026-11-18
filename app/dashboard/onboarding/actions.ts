// =============================================================================
// SERVER ACTION — createShop
// -----------------------------------------------------------------------------
// Flux :
//   1. Vérifie l'utilisateur connecté
//   2. Vérifie qu'il n'a pas déjà une boutique
//   3. Valide les champs texte
//   4. Crée la boutique (slug auto via insertWithSlug)
//   5. Upload le logo (si fourni) vers shop-assets/{shop.id}/logo.webp
//   6. Met à jour shops.logo_url
//   7. En cas d'échec d'upload : supprime la boutique (rollback) et renvoie une erreur
//   8. Redirige vers /dashboard en cas de succès
// =============================================================================

"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { insertWithSlug } from "@/lib/slug/insert-with-slug"
import { validateShopInput } from "@/lib/validation/shop"

export interface CreateShopState {
  success: boolean
  errors?: Record<string, string>
  message?: string
}

export async function createShop(
  _prevState: CreateShopState,
  formData: FormData
): Promise<CreateShopState> {
  const supabase = await createClient()

  // 1. Authentification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, message: "Vous devez être connecté." }
  }

  // 2. Une seule boutique par utilisateur (contrainte unique sur owner_id)
  const { count, error: checkError } = await supabase
    .from("shops")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
  if (checkError) {
    return { success: false, message: "Erreur de vérification. Réessayez." }
  }
  if ((count ?? 0) > 0) {
    return { success: false, message: "Vous avez déjà une boutique." }
  }

  // 3. Validation des champs
  const validation = validateShopInput(formData)
  if (!validation.ok || !validation.data) {
    return { success: false, errors: validation.errors }
  }
  const input = validation.data

  // 4. Insertion de la boutique avec slug unique
  let shop: { id: string; slug: string }
  try {
    const created = await insertWithSlug(supabase, {
      table: "shops",
      baseName: input.name,
      data: {
        owner_id: user.id,
        name: input.name,
        description: input.description,
        whatsapp_number: input.whatsapp_number,
        contact_email: input.contact_email,
        language: input.language,
        theme_mode: input.theme_mode,
        primary_color: input.primary_color,
        catalog_layout: input.catalog_layout,
        is_active: true,
      },
      selectAfterInsert: false,
    })
    shop = { id: created.id, slug: created.slug }
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Impossible de créer la boutique.",
    }
  }

  // 5. Upload du logo (optionnel)
  const logoFile = formData.get("logo")
  if (logoFile instanceof File && logoFile.size > 0) {
    const path = `${shop.id}/logo.webp`

    const { error: uploadError } = await supabase.storage
      .from("shop-assets")
      .upload(path, logoFile, {
        contentType: "image/webp",
        upsert: true,
      })

    if (uploadError) {
      // Rollback : suppression de la boutique
      await supabase.from("shops").delete().eq("id", shop.id)
      return {
        success: false,
        message:
          "Échec de l'upload du logo. La boutique n'a pas été créée. Réessayez.",
      }
    }

    // Récupération de l'URL publique
    const { data: urlData } = supabase.storage
      .from("shop-assets")
      .getPublicUrl(path)

    if (urlData?.publicUrl) {
      await supabase
        .from("shops")
        .update({ logo_url: urlData.publicUrl })
        .eq("id", shop.id)
    }
  }

  // 7. Redirection (lève une exception spéciale Next.js)
  redirect("/dashboard")
}