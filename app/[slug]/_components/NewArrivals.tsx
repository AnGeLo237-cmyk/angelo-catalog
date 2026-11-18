// =============================================================================
// SECTION NOUVEAUTÉS — Carrousel horizontal des produits récents
// -----------------------------------------------------------------------------
// Affiche les 6 produits les plus récents dans un scroll horizontal.
// Section conditionnelle : rendue uniquement si products.length >= 6
// (évite le doublon visuel avec la grille principale sur les petits catalogues).
// =============================================================================

"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import type { PublicProduct } from "@/lib/vitrine/get-shop-by-slug"
import { ProductCard } from "./ProductCard"

export function NewArrivals({
  products,
  shopSlug,
}: {
  products: PublicProduct[]
  shopSlug: string
}) {
  const t = useTranslations("vitrine.sections")

  // Les produits sont déjà triés par date desc et limités à 6 côté serveur.
  // Plus besoin de trier ici.
  if (products.length === 0) return null

  return (
    <section className="bg-surface-muted border-y border-border scroll-reveal">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-on-surface">
            {t("newArrivals")}
          </h2>
          <Link
            href="#produits"
            className="link-underline text-sm text-primary font-medium"
          >
            {t("viewAll")} →
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          {products.map((p) => (
            <div key={p.id} className="shrink-0 w-44 sm:w-48 snap-start">
              <ProductCard product={p} shopSlug={shopSlug} variant="grid" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}