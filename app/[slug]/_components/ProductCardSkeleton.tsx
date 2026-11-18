// =============================================================================
// CARTE PRODUIT — Skeleton (loading)
// -----------------------------------------------------------------------------
// Affiché pendant la navigation, avant que le Server Component ne soit prêt.
// Reproduit la silhouette de ProductCard (grid) pour un swap sans saut visuel.
// =============================================================================

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-border bg-surface-muted">
      <div className="aspect-square bg-border animate-skeleton" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-16 bg-border rounded animate-skeleton" />
        <div className="h-4 w-3/4 bg-border rounded animate-skeleton" />
        <div className="h-4 w-1/2 bg-border rounded animate-skeleton" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}