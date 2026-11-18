// =============================================================================
// FORMULAIRE DE CONNEXION (Client Component)
// -----------------------------------------------------------------------------
// Ce composant est séparé de `page.tsx` pour deux raisons :
//   1. Il utilise `useSearchParams()`, qui n'est disponible qu'à l'exécution.
//      L'isoler permet à la page parente de rester prérendable.
//   2. Il sera enveloppé dans un <Suspense> par la page, ce qui permet à
//      Next.js de streamer son contenu après le HTML statique.
//
// Il utilise le client Supabase "navigateur" pour signInWithPassword.
// =============================================================================

"use client"

import { useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Champ email et mot de passe (composants contrôlés)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // États d'UX : chargement en cours et message d'erreur
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Le middleware ajoute `?redirectTo=...` quand un visiteur non connecté
  // tente d'atteindre /dashboard. On l'utilise pour revenir à la page
  // demandée après connexion, ou on retombe sur /dashboard par défaut.
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    // Client navigateur : la session sera stockée dans un cookie
    // lisible par le middleware et les Server Components.
    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // Succès : navigation vers la cible + rafraîchissement pour que les
    // Server Components voient la nouvelle session immédiatement.
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span>Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          style={{ padding: "0.5rem", border: "1px solid #ccc" }}
        />
      </label>

      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span>Mot de passe</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          style={{ padding: "0.5rem", border: "1px solid #ccc" }}
        />
      </label>

      {error && (
        <p role="alert" style={{ color: "crimson" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{ padding: "0.75rem", cursor: loading ? "wait" : "pointer" }}
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  )
}