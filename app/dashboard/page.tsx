// =============================================================================
// PAGE DASHBOARD (/dashboard)
// -----------------------------------------------------------------------------
// Le layout parent gère la sidebar et la déconnexion.
// Cette page se concentre sur le contenu : infos utilisateur + accès rapides.
// =============================================================================

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UserCreatedAt } from "./UserCreatedAt"
import { connection } from "next/server"

export const instant = false // ← ajouter cette ligne

export default async function DashboardPage() {
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Redirection vers l'onboarding si aucune boutique n'existe
  const { count } = await supabase
    .from("shops")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
  if ((count ?? 0) === 0) redirect("/dashboard/onboarding")

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">Tableau de bord</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-4 bg-white rounded border border-gray-200">
          <p className="text-xs uppercase text-gray-500 mb-1">Email</p>
          <p className="text-sm">{user.email}</p>
        </div>
        <div className="p-4 bg-white rounded border border-gray-200">
          <p className="text-xs uppercase text-gray-500 mb-1">Compte créé le</p>
          <p className="text-sm"><UserCreatedAt iso={user.created_at} /></p>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Les modules Produits, Catégories, Demandes et Statistiques arrivent dans
        les prochaines phases. Utilisez la navigation à gauche pour y accéder.
      </p>
    </section>
  )
}