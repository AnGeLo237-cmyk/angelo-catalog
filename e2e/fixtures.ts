// =============================================================================
// FIXTURES E2E — Constantes et helpers partagés
// =============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// --- Boutique de test ------------------------------------------------------
export const SHOP = {
  slug: process.env.E2E_SHOP_SLUG || "e2e-boutique",
}

// --- Commerçant de test ----------------------------------------------------
export const MERCHANT = {
  email: process.env.E2E_MERCHANT_EMAIL || "",
  password: process.env.E2E_MERCHANT_PASSWORD || "",
}

// --- Admin Supabase (nettoyage uniquement) --------------------------------
// Retourne null si le service_role n'est pas configuré — les tests continuent
// sans cleanup (acceptable en dev local, à éviter en CI si accumulation).
export function tryAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// --- Génère un nom unique pour les entités créées par les tests -----------
export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}`
}