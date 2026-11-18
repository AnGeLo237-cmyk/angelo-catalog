import Link from "next/link"

export default function ProductNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <p className="text-6xl mb-4">📦</p>
        <h1 className="text-2xl font-semibold mb-2">Produit introuvable</h1>
        <p className="text-gray-600 mb-6">
          Ce produit n&apos;existe pas ou n&apos;est plus disponible.
          <br />
          <span className="text-sm">This product does not exist or is no longer available.</span>
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded bg-gray-900 text-white text-sm hover:bg-gray-800"
        >
          ← Retour / Back
        </Link>
      </div>
    </main>
  )
}