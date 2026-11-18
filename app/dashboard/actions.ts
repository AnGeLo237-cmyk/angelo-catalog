// =============================================================================
// SERVER ACTIONS DU DASHBOARD
// -----------------------------------------------------------------------------
// Centralise les actions transverses utilisées par le layout et la sidebar
// (déconnexion pour l'instant).
// =============================================================================

"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

/**
 * Déconnexion : supprime la session et redirige vers /login.
 * Doit rester hors d'un try/catch car `redirect()` lève une exception
 * que Next.js intercepte (comportement attendu).
 */
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}