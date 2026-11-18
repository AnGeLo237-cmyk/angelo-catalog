// =============================================================================
// CARTE PRODUIT — Fallback initiale + badges + bouton panier
// -----------------------------------------------------------------------------
// Variantes :
//   - "grid" : carte verticale, utilisée sur la vitrine et les carrousels
//   - "list" : carte horizontale, utilisée quand catalog_layout = "list"
//
// Le bouton panier est placé EN DEHORS du <Link> pour éviter :
//   1. La navigation accidentelle au clic sur le bouton
//   2. Le HTML invalide (<button> dans <a>)
// Il est positionné en absolu par rapport au wrapper `relative`.
//
// Le padding-right (pr-10 / pr-12) réserve l'espace visuel pour le bouton,
// afin que le prix ne soit jamais masqué.
// =============================================================================

"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import type { PublicProduct } from "@/lib/vitrine/get-shop-by-slug"
import { AddToCartButton } from "../../../components/vitrine/cart/AddToCartButton"
import { PriceTag } from "./PriceTag"

// -----------------------------------------------------------------------------
// Fallback visuel pour un produit sans image : initiale stylisée (pattern Airbnb)
// -----------------------------------------------------------------------------
function ImageFallback({ name }: { name: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-primary/10">
      <span className="text-4xl font-semibold text-primary select-none">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Helper : prépare le payload ProductForCart attendu par AddToCartButton
// -----------------------------------------------------------------------------
function toCartPayload(product: PublicProduct) {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    currency: product.currency,
    imageUrl: product.images[0]?.public_url ?? null,
    stock: product.stock,
  }
}

export function ProductCard({
  product,
  shopSlug,
  variant = "grid",
  animate = false,
  index = 0,
}: {
  product: PublicProduct
  shopSlug: string
  variant?: "grid" | "list"
  animate?: boolean
  index?: number
}) {
  const t = useTranslations("vitrine.product")
  const mainImage = product.images[0]
  const href = `/${shopSlug}/${product.slug}`

  const isOutOfStock = product.stock !== null && product.stock <= 0
  const isLowStock =
    product.stock !== null && product.stock > 0 && product.stock <= 3

  const animationClass = animate ? "animate-fade-in-up" : ""
  const animationStyle = animate
    ? { animationDelay: `${index * 40}ms` }
    : undefined

  const cartPayload = toCartPayload(product)

  // ===========================================================================
  // VARIANTE LISTE
  // ===========================================================================
  if (variant === "list") {
    return (
      <div
        className={`relative ${animationClass}`}
        style={animationStyle}
      >
        <Link
          href={href}
          className="group flex gap-4 rounded-xl border border-border bg-surface-muted p-3 hover:border-primary transition-colors"
        >
          {/* Image */}
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-surface flex-shrink-0">
            {mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainImage.public_url}
                alt={mainImage.alt_text ?? product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <ImageFallback name={product.name} />
            )}
          </div>

          {/* Contenu — pr-12 réserve l'espace pour le bouton panier */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1 pr-12">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {product.is_featured && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    ★ {t("featured")}
                  </span>
                )}
                {product.is_new && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-on-surface/20 text-on-surface-muted">
                    {t("new")}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-on-surface truncate mt-1">
                {product.name}
              </h3>
              {product.category_name && (
                <p className="text-xs text-on-surface-muted mt-0.5">
                  {product.category_name}
                </p>
              )}
              {product.description && (
                <p className="text-sm text-on-surface-muted mt-2 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <PriceTag price={product.price} currency={product.currency} />
              {isOutOfStock && (
                <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                  {t("outOfStock")}
                </span>
              )}
              {isLowStock && !isOutOfStock && (
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">
                  {t("stockLow", { count: product.stock! })}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Bouton panier en absolu, hors du Link */}
        {!isOutOfStock && (
          <div className="absolute bottom-3 right-3 z-10">
            <AddToCartButton product={cartPayload} variant="card" />
          </div>
        )}
      </div>
    )
  }

  // ===========================================================================
  // VARIANTE GRILLE (par défaut)
  // ===========================================================================
  return (
    <div
      className={`relative group ${animationClass}`}
      style={animationStyle}
    >
      <Link
        href={href}
        className="flex flex-col rounded-xl overflow-hidden border border-border bg-surface-muted
                   hover:border-primary hover:shadow-lg hover:-translate-y-1
                   transition-all duration-200"
      >
        {/* Image + badges */}
        <div className="relative aspect-square overflow-hidden bg-surface">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainImage.public_url}
              alt={mainImage.alt_text ?? product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <ImageFallback name={product.name} />
          )}

          {/* Badge featured (haut-gauche) */}
          {product.is_featured && (
            <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-primary text-white shadow-sm">
              ★ {t("featured")}
            </span>
          )}

          {/* Badge nouveau (haut-droit) */}
          {product.is_new && (
            <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border border-on-surface/20 bg-surface/90 backdrop-blur text-on-surface shadow-sm">
              {t("new")}
            </span>
          )}

          {/* Overlay rupture de stock */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-sm font-medium px-3 py-1 rounded bg-red-600">
                {t("outOfStock")}
              </span>
            </div>
          )}
        </div>

        {/* Contenu — pr-10 réserve l'espace pour le bouton panier en bas à droite */}
        <div className="p-4 flex flex-col gap-1.5">
          {product.category_name && (
            <p className="text-[11px] font-medium uppercase tracking-wider text-on-surface-muted">
              {product.category_name}
            </p>
          )}
          <h3 className="font-semibold text-on-surface line-clamp-2 leading-snug">
            {product.name}
          </h3>
          <div className="flex items-center justify-between mt-1 pr-10">
            <PriceTag price={product.price} currency={product.currency} size="md" />
            {isLowStock && !isOutOfStock && (
              <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">
                {t("stockLow", { count: product.stock! })}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Bouton panier en absolu, hors du Link */}
      {!isOutOfStock && (
        <div className="absolute bottom-3 right-3 z-10">
          <AddToCartButton product={cartPayload} variant="card" />
        </div>
      )}
    </div>
  )
}