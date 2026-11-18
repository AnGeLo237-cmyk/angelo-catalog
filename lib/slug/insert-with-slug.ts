// =============================================================================
// INSERTION ROBUSTE AVEC SLUG UNIQUE
// -----------------------------------------------------------------------------
// Cette fonction combine generateUniqueSlug() et l'insertion en base.
// Elle gère la race condition : si deux inserts simultanés utilisent le même
// slug, PostgreSQL lève une erreur 23505 (unique_violation). On la détecte et
// on régénère un slug, puis on réessaie (max 3 tentatives).
//
// Usage typique dans un Server Action :
//   const shop = await insertWithSlug(supabase, {
//     table: "shops",
//     baseName: formData.get("name"),
//     data: { owner_id: user.id, name, ... },
//     selectAfterInsert: true,
//   })
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { generateUniqueSlug } from "./generate-unique-slug"
import { slugify } from "./slugify"

export interface InsertWithSlugOptions<T extends Record<string, unknown>> {
  /** Table cible */
  table: "shops" | "products"
  /** Texte de base pour générer le slug (généralement le nom) */
  baseName: string
  /** Pour "products" : identifiant de la boutique (contexte d'unicité) */
  shopId?: string
  /** Données à insérer (sans le slug : il sera ajouté automatiquement) */
  data: Omit<T, "slug">
  /** Nombre max de tentatives en cas de collision concurrente (défaut 3) */
  maxRetries?: number
  /** Si true, retourne la ligne insérée complète */
  selectAfterInsert?: boolean
}

const PG_UNIQUE_VIOLATION = "23505"

/**
 * Insère une ligne dans la table cible avec un slug unique.
 * Retourne la ligne insérée (ou son id selon selectAfterInsert).
 */
export async function insertWithSlug<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  options: InsertWithSlugOptions<T>
): Promise<{ id: string; slug: string; data?: T }> {
  const {
    table,
    baseName,
    shopId,
    data,
    maxRetries = 3,
    selectAfterInsert = false,
  } = options

  let lastError: unknown = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Étape 1 : générer un slug unique côté application
    // ⚠️ À chaque retry, on ajoute un préfixe différent pour éviter de
    //     retomber sur le même slug (race condition reproductible).
    const nameForThisAttempt =
      attempt === 0 ? baseName : `${baseName} ${randomShortSuffix()}`

    const slug = await generateUniqueSlug(supabase, nameForThisAttempt, {
      table,
      shopId,
    })

    // Étape 2 : tentative d'insertion
    const insertPayload = { ...data, slug } as Record<string, unknown>
    const query = supabase.from(table).insert(insertPayload).select(
      selectAfterInsert ? "*" : "id, slug"
    )

    const { data: inserted, error } = await query

    if (!error && inserted && inserted.length > 0) {
      // Succès
      const row = inserted[0] as unknown as { id: string; slug: string } & T
      return selectAfterInsert
        ? { id: row.id, slug: row.slug, data: row as T }
        : { id: row.id, slug: row.slug }
    }

    // Étape 3 : analyser l'erreur
    if (error?.code === PG_UNIQUE_VIOLATION) {
      // Collision concurrente : un autre insert a pris le slug entre la
      // vérification et l'insertion. On réessaie avec un nouveau slug.
      lastError = error
      continue
    }

    // Autre erreur : on remonte immédiatement (ne pas masquer un vrai bug)
    throw new Error(`Erreur à l'insertion dans "${table}" : ${error?.message}`)
  }

  // Échec après tous les retries
  throw new Error(
    `Impossible d'insérer dans "${table}" après ${maxRetries} tentatives ` +
      `(collision de slug persistante). Détail : ${
        (lastError as { message?: string })?.message ?? "inconnu"
      }`
  )
}

/** Petit suffixe aléatoire court pour varier les tentatives de retry */
function randomShortSuffix(): string {
  return Math.random().toString(36).slice(2, 6)
}

// Ré-export pour commodité (permet d'utiliser slugify depuis ce module)
export { slugify }