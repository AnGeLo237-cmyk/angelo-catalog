// =============================================================================
// GRILLE DE PRODUITS — Rend le layout choisi par la boutique
// =============================================================================

"use client"

import type { PublicProduct } from "@/lib/vitrine/get-shop-by-slug"
import type { CatalogLayout } from "@/lib/types/shop"
import { ProductCard } from "./ProductCard"

export function ProductGrid({
  products,
  shopSlug,
  layout,
  animate = false,
}: {
  products: PublicProduct[]
  shopSlug: string
  layout: CatalogLayout
  animate?: boolean
}) {
  if (layout === "list") {
    return (
      <div className="flex flex-col gap-3">
        {products.map((p, index) => (
          <ProductCard
            key={p.id}
            product={p}
            shopSlug={shopSlug}
            variant="list"
            animate={animate}
            index={index}
          />
        ))}
      </div>
    )
  }

  const cols =
    layout === "grid-2"
      ? "grid-cols-1 sm:grid-cols-2"
      : layout === "grid-4"
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3"

  return (
    <div className={`grid ${cols} gap-4 sm:gap-6`}>
      {products.map((p, index) => (
        <ProductCard
          key={p.id}
          product={p}
          shopSlug={shopSlug}
          variant="grid"
          animate={animate}
          index={index}
        />
      ))}
    </div>
  )
}