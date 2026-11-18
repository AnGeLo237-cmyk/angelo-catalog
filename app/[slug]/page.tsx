// =============================================================================
// PAGE VITRINE PUBLIQUE (/[slug])
// -----------------------------------------------------------------------------
// Server Component qui charge boutique, catégories, produits, puis délègue
// l'interactivité à VitrineClient (recherche, filtres).
// =============================================================================

import { notFound } from "next/navigation"
import { createTranslator } from "next-intl"
import {
  getShopBySlug,
  getShopCategories,
  getShopProducts,
  getLastCatalogUpdate,
  getShopCoverImage,
  getFeaturedProducts,
  extractTagline,
} from "@/lib/vitrine/get-shop-by-slug"
import { loadMessages } from "@/lib/vitrine/load-messages"
import { formatRelativeTime } from "@/lib/vitrine/format-relative-time"
import { VitrineClient } from "./VitrineClient"
import { ShopHero } from "./_components/ShopHero"
import { NewArrivals } from "./_components/NewArrivals"
import { FeaturedSection } from "./_components/FeaturedSection"
import { RealtimeShopListener } from "@/components/vitrine/RealtimeShopListener"

export const instant = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) return { title: "Boutique introuvable" }

  return {
    title: shop.name,
    description: shop.description ?? `Découvrez la boutique ${shop.name}`,
    openGraph: {
      title: shop.name,
      description: shop.description ?? undefined,
      images: shop.logo_url ? [shop.logo_url] : undefined,
      type: "website",
    },
  }
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  // Charge produits, catégories, mise à jour, cover en parallèle
  const [categories, products, lastCatalogUpdate, coverImageUrl] =
    await Promise.all([
      getShopCategories(shop.id),
      getShopProducts(shop.id),
      getLastCatalogUpdate(shop),
      getShopCoverImage(shop.id),
    ])

  // Compteur de produits par catégorie (pour les chips)
  const categoryCountMap = new Map<string, number>()
  for (const p of products) {
    if (p.category_id) {
      categoryCountMap.set(
        p.category_id,
        (categoryCountMap.get(p.category_id) ?? 0) + 1
      )
    }
  }
  const categoriesWithCount = categories.map((c) => ({
    ...c,
    product_count: categoryCountMap.get(c.id) ?? 0,
  }))

  // Tagline : 1ʳᵉ phrase de description
  const tagline = extractTagline(shop.description)

  // Nouveautés : 6 plus récents (déjà triés côté serveur)
  const newest = [...products]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 6)
  const newestIds = new Set(newest.map((p) => p.id))

  // Coups de cœur : featured HORS nouveautés (évite le doublon visuel)
  const featured = await getFeaturedProducts(
    shop.id,
    Array.from(newestIds),
    4
  )

  const messages = loadMessages(shop.language)
  const t = createTranslator({
    locale: shop.language,
    messages,
    namespace: "vitrine",
  })

  const lastUpdate = lastCatalogUpdate
    ? { relative: formatRelativeTime(lastCatalogUpdate, shop.language) }
    : null

  const showNewArrivals = newest.length >= 6

  return (
    <main id="main-content" tabIndex={-1}>
      <RealtimeShopListener shopId={shop.id} />
      <ShopHero
        shop={shop}
        productCount={products.length}
        categoryCount={categories.length}
        lastUpdate={lastUpdate}
        tagline={tagline}
        coverImageUrl={coverImageUrl}
      />

      {showNewArrivals && (
        <NewArrivals products={newest} shopSlug={shop.slug} />
      )}

      <FeaturedSection products={featured} shopSlug={shop.slug} />

      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 scroll-reveal">
        <VitrineClient
          shop={shop}
          categories={categoriesWithCount}
          products={products}
          noResultsText={{
            title: t("search.noResults"),
            hint: t("search.noResultsHint"),
          }}
        />
      </div>

      <footer
        className="border-t border-border mt-16"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-on-surface-muted">
          © {new Date().getFullYear()} {shop.name}
        </div>
      </footer>
    </main>
  )
}