// =============================================================================
// PAGE PRODUIT DÉTAILLÉE (/[slug]/[productSlug])
// =============================================================================

import Link from "next/link"
import { notFound } from "next/navigation"
import { createTranslator } from "next-intl"
import {
  getShopBySlug,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/vitrine/get-shop-by-slug"
import { loadMessages } from "@/lib/vitrine/load-messages"
import { ProductDetail } from "./ProductDetail"
import { YouMightLike } from "../_components/YouMightLike"
import { RealtimeShopListener } from "@/components/vitrine/RealtimeShopListener"
import { TrackView } from "./TrackView"

export const instant = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>
}) {
  const { slug, productSlug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) return { title: "Boutique introuvable" }

  const product = await getProductBySlug(shop.id, productSlug)
  if (!product) return { title: "Produit introuvable" }

  return {
    title: `${product.name} — ${shop.name}`,
    description: product.description ?? undefined,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: product.images[0]?.public_url
        ? [product.images[0].public_url]
        : undefined,
      type: "website",
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>
}) {
  const { slug, productSlug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  const product = await getProductBySlug(shop.id, productSlug)
  if (!product) notFound()

  // Produits liés : même catégorie prioritaire, complétés par les featured
  const related = await getRelatedProducts(
    shop.id,
    product.category_id,
    product.id,
    4
  )

  const messages = loadMessages(shop.language)
  const t = createTranslator({
    locale: shop.language,
    messages,
    namespace: "vitrine",
  })

  return (
    <main id="main-content" tabIndex={-1}>
      <TrackView shopId={shop.id} productId={product.id} />
      <RealtimeShopListener shopId={shop.id} productId={product.id} />
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Link
          href={`/${shop.slug}`}
          className="link-underline inline-flex items-center gap-1 text-sm text-on-surface-muted hover:text-on-surface transition-colors"
        >
          ← {t("product.back")}
        </Link>
      </div>

      <ProductDetail shop={shop} product={product} />

      <YouMightLike
        products={related}
        shopSlug={shop.slug}
        currentCategoryId={product.category_id}
        shopLanguage={shop.language}
      />

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