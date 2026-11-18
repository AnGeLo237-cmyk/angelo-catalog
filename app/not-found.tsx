// =============================================================================
// 404 GLOBAL (/app/not-found.tsx)
// -----------------------------------------------------------------------------
// Affiché pour toute URL inexistante NON couverte par un not-found plus
// spécifique (par exemple : /xyz qui ne correspond à aucune route).
//
// ⚠️ Rendu hors du layout [slug] : pas de contexte boutique, pas de thème.
//    On utilise des couleurs système neutres pour rester sobre.
//
// Bilingue par détection Accept-Language côté serveur (simple et suffisant
// pour une page d'erreur).
// =============================================================================

import Link from "next/link"
import { headers } from "next/headers"

export default async function NotFound() {
  const headersList = await headers()
  const acceptLang = headersList.get("accept-language") ?? ""
  const isEnglish = acceptLang.toLowerCase().startsWith("en")

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-gray-200 dark:text-gray-800 mb-4 tabular-nums">
          404
        </p>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {isEnglish ? "Page not found" : "Page introuvable"}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {isEnglish
            ? "The page you are looking for does not exist or has been moved."
            : "La page que vous cherchez n'existe pas ou a été déplacée."}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition"
        >
          ← {isEnglish ? "Back to home" : "Retour à l'accueil"}
        </Link>
      </div>
    </main>
  )
}