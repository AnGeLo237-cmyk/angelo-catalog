// =============================================================================
// SECTION « VOUS AIMEREZ AUSSI »
// -----------------------------------------------------------------------------
// Affiche jusqu'à 4 produits liés au produit consulté, tous cliquables.
//
// Le titre de la sous-section s'adapte automatiquement :
//   - « Dans la même catégorie » si tous les produits proviennent de la
//     catégorie du produit courant
//   - « Nos coups de cœur » sinon (fallback featured)
//
// ⚠️ SERVER COMPONENT — Pas de "use client".
//    On utilise `createTranslator` (API next-intl pour Server Components),
//    qui exige que les clés existent dans `vitrine.product` du fichier JSON
//    chargé. Les clés `youMightLike`, `relatedFromSameCategory` et
//    `relatedFeatured` doivent donc être DANS `vitrine.product`, pas ailleurs.
// =============================================================================

import { createTranslator } from "next-intl"
import type { PublicProduct } from "@/lib/vitrine/get-shop-by-slug"
import { loadMessages } from "@/lib/vitrine/load-messages"
import { ProductCard } from "../_components/ProductCard"

export function YouMightLike({
  products,
  shopSlug,
  currentCategoryId,
  shopLanguage,
}: {
  products: PublicProduct[]
  shopSlug: string
  currentCategoryId: string | null
  shopLanguage: "fr" | "en"
}) {
  // Pas de produits liés → on ne rend rien du tout.
  // Évite une section vide (avec titre mais sans cartes) sur les petites
  // boutiques qui n'ont qu'un seul produit publié.
  if (products.length === 0) return null

  // Charge les messages de la langue de la BOUTIQUE (pas du visiteur).
  const messages = loadMessages(shopLanguage)

  // Translator local pour la fiche produit.
  // `namespace: "vitrine.product"` → `t("youMightLike")` cherche
  // `vitrine.product.youMightLike` dans le JSON.
  const t = createTranslator({
    locale: shopLanguage,
    messages,
    namespace: "vitrine.product",
  })

  // Détermine le sous-titre :
  // - même catégorie : si on a un categoryId ET que tous les produits
  //   liés partagent ce categoryId
  // - sinon : fallback featured
  const allSameCategory =
    currentCategoryId !== null &&
    products.every((p) => p.category_id === currentCategoryId)

  const sectionSubtitle = allSameCategory
    ? t("relatedFromSameCategory")
    : t("relatedFeatured")

  return (
    <section className="max-w-5xl mx-auto px-4 py-10 sm:py-14 scroll-reveal border-t border-border">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
          {t("youMightLike")}
        </h2>
        <p className="text-sm text-on-surface-muted mt-1">{sectionSubtitle}</p>
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
    </section>
  )
}