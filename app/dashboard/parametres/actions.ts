// =============================================================================
// SERVER ACTIONS — PARAMÈTRES DE LA BOUTIQUE
// -----------------------------------------------------------------------------
// ⚠️ Le helper `updateShopField` utilise `.select("id")` pour forcer PostgREST
//    à retourner les lignes réellement mises à jour. Sans cela, un UPDATE
//    bloqué par RLS renvoie `data: null, error: null` et on croit à un succès.
//
// 📌 Note sur updateLanguage :
//    - revalidatePath("/", "layout") invalide le cache du RootLayout.
//    - Le CLIENT doit aussi appeler router.refresh() après succès pour que
//      NextIntlClientProvider recharge les nouveaux messages.
//    - Si le changement ne se voit toujours pas, la variante `redirect`
//      (commentée plus bas) force une navigation complète et contourne
//      tous les caches.
// =============================================================================

"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { COOKIE_NAME } from "@/i18n/request"
import { createClient } from "@/lib/supabase/server"
import type {
  ThemeMode,
  ShopLanguage,
  CatalogLayout,
} from "@/lib/types/shop"

// --- Types de retour communs ------------------------------------------------
type ActionResult = { success: true } | { success: false; error: string }

// --- Valeurs autorisées (miroir des enums PostgreSQL) ----------------------
const VALID_THEMES: readonly ThemeMode[] = ["light", "dark", "system"]
const VALID_LANGUAGES: readonly ShopLanguage[] = ["fr", "en"]
const VALID_LAYOUTS: readonly CatalogLayout[] = [
  "grid-2",
  "grid-3",
  "grid-4",
  "list",
]

// Format hexadécimal court (#fff) ou long (#ffffff)
const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

// --- Helpers internes ------------------------------------------------------

async function getOwnedShopId(): Promise<
  { shopId: string } | { error: string }
> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    return {
      error:
        "Session expirée ou invalide. Reconnectez-vous puis réessayez.",
    }
  }
  if (!user) return { error: "Vous devez être connecté." }

  const { data: shop, error } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle()

  if (error) {
    return { error: "Erreur lors de la récupération de la boutique." }
  }
  if (!shop) return { error: "Boutique introuvable." }

  return { shopId: shop.id }
}

async function updateShopField(
  shopId: string,
  field: "theme_mode" | "primary_color" | "language" | "catalog_layout",
  value: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("shops")
    .update({ [field]: value })
    .eq("id", shopId)
    .select("id") // ← forcе le retour des lignes affectées

  if (error) {
    return { success: false, error: error.message }
  }

  if (!data || data.length === 0) {
    return {
      success: false,
      error:
        "La mise à jour a été refusée (session expirée ou permission insuffisante). Reconnectez-vous puis réessayez.",
    }
  }

  return { success: true }
}

// --- Actions publiques ----------------------------------------------------

export async function updateThemeMode(mode: ThemeMode): Promise<ActionResult> {
  if (!VALID_THEMES.includes(mode)) {
    return { success: false, error: "Mode invalide." }
  }

  const owned = await getOwnedShopId()
  if ("error" in owned) return { success: false, error: owned.error }

  const result = await updateShopField(owned.shopId, "theme_mode", mode)
  if (!result.success) return result

  revalidatePath("/dashboard", "layout")
  return { success: true }
}

export async function updatePrimaryColor(color: string): Promise<ActionResult> {
  if (!HEX_COLOR.test(color)) {
    return { success: false, error: "Couleur invalide (format hexadécimal)." }
  }

  const owned = await getOwnedShopId()
  if ("error" in owned) return { success: false, error: owned.error }

  const result = await updateShopField(owned.shopId, "primary_color", color)
  if (!result.success) return result

  revalidatePath("/dashboard", "layout")
  return { success: true }
}

/**
 * Langue de l'interface.
 *
 * Stratégie par défaut (recommandée) :
 *   - revalidatePath("/", "layout") pour invalider le RootLayout côté serveur.
 *   - Le client appelle router.refresh() après succès (voir ParametresClient).
 *
 * Stratégie de secours (si la langue ne bascule toujours pas) :
 *   - Commenter le revalidatePath ci-dessous.
 *   - Décommenter le `redirect("/dashboard/parametres")` en fin de fonction.
 *   - Décommenter l'import `redirect` en haut du fichier.
 *   → Force une navigation complète qui contourne tous les caches.
 */

export async function updateLanguage(lang: ShopLanguage): Promise<ActionResult> {
  if (!VALID_LANGUAGES.includes(lang)) {
    return { success: false, error: "Langue invalide." }
  }

  const owned = await getOwnedShopId()
  if ("error" in owned) return { success: false, error: owned.error }

  // 1. Persister en base
  const result = await updateShopField(owned.shopId, "language", lang)
  if (!result.success) return result

  // 2. Écrire le cookie : met à jour le cache Next.js de manière fiable
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 an
    sameSite: "lax",
  })

  // 3. Revalider le layout racine pour propager aux Server Components
  revalidatePath("/", "layout")
  return { success: true }
}

export async function updateCatalogLayout(
  layout: CatalogLayout
): Promise<ActionResult> {
  if (!VALID_LAYOUTS.includes(layout)) {
    return { success: false, error: "Disposition invalide." }
  }

  const owned = await getOwnedShopId()
  if ("error" in owned) return { success: false, error: owned.error }

  const result = await updateShopField(owned.shopId, "catalog_layout", layout)
  if (!result.success) return result

  revalidatePath("/dashboard/parametres")
  return { success: true }
}