// =============================================================================
// SECTION COUPS DE CŒUR — Affichée si assez de featured distincts des nouveautés
// -----------------------------------------------------------------------------
// Évite le doublon avec la section Nouveautés : on n'affiche que les produits
// featured qui ne figurent PAS dans les 6 plus récents.
// Si moins de 3 produits restent, la section n'est pas rendue.
// =============================================================================

"use client"

import { useTranslations } from "next-intl"
import type { PublicProduct } from "@/lib/vitrine/get-shop-by-slug"
import { ProductCard } from "./ProductCard"

export function FeaturedSection({
  products,
  shopSlug,
}: {
  products: PublicProduct[]
  shopSlug: string
}) {
  const t = useTranslations("vitrine.sections")

  // Section masquée si moins de 3 produits → évite un rendu pauvre
  if (products.length < 3) return null

  return (
    <section className="bg-surface border-b border-border scroll-reveal">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <div className="mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-on-surface">
            ★ {t("featured")}
          </h2>
          <p className="text-sm text-on-surface-muted mt-1">
            {t("featuredSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              shopSlug={shopSlug}
              variant="grid"
            />
          ))}
        </div>
      </div>
    </section>
  )
}