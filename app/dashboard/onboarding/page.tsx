// =============================================================================
// PAGE ONBOARDING (/dashboard/onboarding)
// -----------------------------------------------------------------------------
// Server Component minimal :
//   - Vérifie la session (redondance avec le middleware)
//   - Redirige vers /dashboard si une boutique existe déjà
//   - Affiche le formulaire (Client Component) sinon
// =============================================================================

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingForm } from "./OnboardingForm"
import { connection } from "next/server"

// Indique à Next.js que cette route ne peut pas être prérendue statiquement.
// Elle sera rendue à la demande pour chaque requête, ce qui est nécessaire
// car son contenu dépend de la session de l'utilisateur (cookies + requête DB).
export const instant = false

export default async function OnboardingPage() {
  await connection() // ← toute la page dépend de la requête (cookies + DB)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { count } = await supabase
    .from("shops")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)

  if ((count ?? 0) > 0) redirect("/dashboard")

  return (
    <main style={{ maxWidth: 640, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Créez votre boutique</h1>
      <p style={{ color: "#555", marginBottom: "2rem" }}>
        Quelques informations suffisent pour démarrer. Vous pourrez tout
        modifier plus tard depuis vos paramètres.
      </p>
      <OnboardingForm defaultEmail={user.email ?? null} />
    </main>
  )
}