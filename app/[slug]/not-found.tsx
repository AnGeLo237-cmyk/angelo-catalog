// =============================================================================
// 404 BOUTIQUE
// -----------------------------------------------------------------------------
// Cette page s'affiche hors du contexte du layout (pas de shop chargée).
// On utilise donc des textes bilingues statiques avec détection basique.
// =============================================================================

import Link from "next/link"

export default function ShopNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="text-center max-w-md">
        <p className="text-6xl mb-4">🏚️</p>
        <h1 className="text-2xl font-semibold mb-2">Boutique introuvable</h1>
        <p className="text-gray-600 mb-6">
          Cette boutique n&apos;existe pas ou a été désactivée.
          <br />
          <span className="text-sm">This shop does not exist or has been disabled.</span>
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded bg-gray-900 text-white text-sm hover:bg-gray-800"
        >
          ← Retour à l&apos;accueil / Back to home
        </Link>
      </div>
    </main>
  )
}