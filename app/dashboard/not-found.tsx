// =============================================================================
// 404 DASHBOARD (/app/dashboard/not-found.tsx)
// -----------------------------------------------------------------------------
// Affiché quand une route /dashboard/* n'existe pas (ex: produit introuvable
// en édition).
// =============================================================================

import Link from "next/link"

export default function DashboardNotFound() {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-4">🔍</p>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Page introuvable
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Cette ressource n&apos;existe pas ou a été supprimée.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition"
      >
        ← Retour au tableau de bord
      </Link>
    </div>
  )
}