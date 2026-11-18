// =============================================================================
// GÉNÉRATION D'UN SLUG UNIQUE — Vérification + suffixe progressif
// -----------------------------------------------------------------------------
// Cette fonction garantit qu'un slug est unique dans la table cible.
// Elle combine :
//   1. slugify() pour obtenir la base
//   2. Une vérification d'existence en base
//   3. Un suffixe numérique (-2, -3, …) si le slug existe déjà
//   4. Un suffixe aléatoire en dernier recours (après N tentatives)
//
// ⚠️ Race condition : entre la vérification et l'insertion, un autre
// utilisateur peut insérer le même slug. C'est pourquoi la fonction
// d'insertion (voir Partie 3) gère aussi l'erreur 23505 (unique_violation).
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { slugify, type SlugifyOptions } from "./slugify"

export interface GenerateUniqueSlugOptions extends SlugifyOptions {
  /**
   * Table dans laquelle vérifier l'unicité : "shops" ou "products".
   */
  table: "shops" | "products" | "categories"
  /**
   * Pour la table "products", l'unicité est par boutique.
   * On doit donc filtrer les vérifications par shop_id.
   * Ignoré pour "shops".
   */
  shopId?: string
  /**
   * Nombre d'essais numériques avant de passer au suffixe aléatoire.
   * Par défaut 10 : on essaie "slug-2" à "slug-11", puis aléatoire.
   */
  maxNumericSuffix?: number
}

/**
 * Retourne un slug unique dans la table cible.
 * Si `baseName` ne produit aucun slug valide (ex: "###"), une erreur est levée.
 */
export async function generateUniqueSlug(
  supabase: SupabaseClient,
  baseName: string,
  options: GenerateUniqueSlugOptions
): Promise<string> {
  const {
    table,
    shopId,
    maxNumericSuffix = 10,
    maxLength = 80,
    separator = "-",
  } = options

  // Étape 1 : slug de base
  const baseSlug = slugify(baseName, { maxLength, separator })

  if (!baseSlug) {
    throw new Error(
      "Le nom fourni ne permet pas de générer un slug valide. " +
        "Utilisez au moins une lettre ou un chiffre."
    )
  }

  // Étape 2 : vérifier le slug de base
  const isTaken = await slugExists(supabase, table, baseSlug, shopId)
  if (!isTaken) return baseSlug

  // Étape 3 : essayer les suffixes numériques (-2, -3, …)
  // On réserve de la place pour le suffixe dans la longueur max.
  for (let i = 2; i <= maxNumericSuffix + 1; i++) {
    const suffix = `${separator}${i}`
    const candidate = truncateForSuffix(baseSlug, suffix, maxLength)
    const taken = await slugExists(supabase, table, candidate, shopId)
    if (!taken) return candidate
  }

  // Étape 4 : dernier recours — suffixe aléatoire de 6 caractères
  // On boucle un nombre limité de fois pour éviter une boucle infinie
  // (théoriquement improbable avec 6 caractères aléatoires, mais on protège).
  for (let attempt = 0; attempt < 5; attempt++) {
    const randomSuffix = `${separator}${randomString(6)}`
    const candidate = truncateForSuffix(baseSlug, randomSuffix, maxLength)
    const taken = await slugExists(supabase, table, candidate, shopId)
    if (!taken) return candidate
  }

  // Si on arrive ici, c'est que la base est saturée pour ce nom.
  // C'est extrêmement improbable, mais on échoue explicitement.
  throw new Error(
    "Impossible de générer un slug unique. Veuillez essayer un autre nom."
  )
}

// -----------------------------------------------------------------------------
// Helpers internes
// -----------------------------------------------------------------------------

/**
 * Vérifie si un slug existe déjà dans la table cible.
 * Pour "products", la vérification est limitée à la boutique (shop_id).
 */
async function slugExists(
  supabase: SupabaseClient,
  table: "shops" | "products" | "categories",
  slug: string,
  shopId?: string
): Promise<boolean> {
  let query = supabase.from(table).select("id", { count: "exact", head: true }).eq("slug", slug)

  // L'unicité des produits est PAR BOUTIQUE (contrainte (shop_id, slug) unique)
  if ((table === "products" || table === "categories") && shopId) {
    query = query.eq("shop_id", shopId)
  }

  const { count, error } = await query

  if (error) {
    throw new Error(`Erreur lors de la vérification du slug : ${error.message}`)
  }

  return (count ?? 0) > 0
}

/**
 * Tronque le slug pour laisser la place au suffixe, tout en respectant maxLength.
 * Ex: baseSlug="robe-en-wax-elegante" (20), suffix="-2" (2), max=80
 *     → pas de troncature
 * Ex: baseSlug de 79 caractères, suffix="-2" → tronque à 78 pour insérer "-2"
 */
function truncateForSuffix(
  baseSlug: string,
  suffix: string,
  maxLength: number
): string {
  const availableLength = maxLength - suffix.length
  if (baseSlug.length <= availableLength) {
    return `${baseSlug}${suffix}`
  }
  // On tronque proprement et on nettoie les séparateurs en fin
  return `${baseSlug.slice(0, availableLength).replace(/[-_]+$/, "")}${suffix}`
}

/**
 * Génère une chaîne aléatoire alphanumérique de longueur N.
 * Utilise Math.random pour éviter d'introduire crypto côté serveur.
 */
function randomString(length: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return result
}