// =============================================================================
// PAGE DE CONNEXION (/login)
// -----------------------------------------------------------------------------
// La page est un Server Component minimal. Elle enveloppe le formulaire
// (qui utilise `useSearchParams()`) dans un <Suspense>.
//
// Pourquoi <Suspense> ? Parce que Next.js ne peut pas prérendre un composant
// qui lit les paramètres d'URL. Le <Suspense> dit à Next.js : "prérends le
// squelette de la page, et streame le formulaire dès que les données URL
// sont disponibles côté client". C'est la solution officielle recommandée.
// =============================================================================

import { Suspense } from "react"
import { LoginForm } from "@/app/login/LoginForm"

export default function LoginPage() {
  return (
    <div style={{ maxWidth: 400, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>Connexion</h1>

      {/* Le fallback est affiché instantanément, puis remplacé par le formulaire */}
      <Suspense fallback={<p style={{ color: "#666" }}>Chargement du formulaire…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}