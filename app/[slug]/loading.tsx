import { ProductGridSkeleton } from "./_components/ProductCardSkeleton"

export default function ShopLoading() {
  return (
    <main>
      {/* Hero skeleton */}
      <div className="bg-gradient-to-br from-surface to-surface-muted border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-border animate-skeleton" />
            <div className="flex-1 space-y-3 w-full">
              <div className="h-8 w-48 bg-border rounded animate-skeleton mx-auto sm:mx-0" />
              <div className="h-4 w-96 max-w-full bg-border rounded animate-skeleton mx-auto sm:mx-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Grille skeleton */}
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <div className="h-12 bg-border rounded-xl animate-skeleton mb-6" />
        <ProductGridSkeleton count={6} />
      </div>
    </main>
  )
}