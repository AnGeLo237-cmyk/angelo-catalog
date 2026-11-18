// =============================================================================
// DÉTAIL PRODUIT — Galerie + infos + CTA
// =============================================================================

"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import type { PublicShop, PublicProduct } from "@/lib/vitrine/get-shop-by-slug"
import { PriceTag } from "../_components/PriceTag"
import { WhatsAppButton } from "../_components/WhatsAppButton"
import { ContactModal } from "./ContactModal"
import { AddToCartButton } from "../../../components/vitrine/cart/AddToCartButton"

export function ProductDetail({
  shop,
  product,
}: {
  shop: PublicShop
  product: PublicProduct
}) {
  const t = useTranslations("vitrine.product")
  const tContact = useTranslations("vitrine.contact")
  const [activeImage, setActiveImage] = useState(0)
  const [contactOpen, setContactOpen] = useState(false)

  const hasImages = product.images.length > 0
  const isOutOfStock = product.stock !== null && product.stock <= 0
  const isLowStock = product.stock !== null && product.stock > 0 && product.stock <= 5

  return (
    <>
      <article className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Galerie */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-surface-muted border border-border">
            {hasImages ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[activeImage].public_url}
                alt={product.images[activeImage].alt_text ?? product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-muted">
                {t("noImage")}
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                    idx === activeImage
                      ? "border-primary"
                      : "border-transparent hover:border-border"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.public_url}
                    alt={img.alt_text ?? `${product.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

          {/* Infos */}
          <div className="space-y-5">
          {product.is_featured && (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-primary text-white">
              ★ {t("featured")}
            </span>
          )}

          <div>
            {product.category_name && (
              <p className="text-xs font-medium uppercase tracking-wider text-on-surface-muted mb-1">
                {product.category_name}
              </p>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface leading-tight">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <PriceTag price={product.price} currency={product.currency} size="lg" />
            {isOutOfStock && (
              <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                {t("outOfStock")}
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                {t("stockLow", { count: product.stock! })}
              </span>
            )}
          </div>

          {product.description && (
            <div>
              <h2 className="text-sm font-semibold text-on-surface mb-2">
                {t("description")}
              </h2>
              <p className="text-on-surface-muted leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          <div className="pt-4">
              {!isOutOfStock && (
                <WhatsAppButton
                  phoneNumber={shop.whatsapp_number}
                  productName={product.name}
                  productId={product.id}
                  shopId={shop.id}
                  fullWidth
                />
              )}

              <AddToCartButton
                product={{
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  currency: product.currency,
                  imageUrl: product.images[0]?.public_url ?? null,
                  stock: product.stock,
                }}
                variant="detail"
              />              

              {/* ✅ Nouveau : bouton secondaire pour le formulaire */}
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border-2 border-on-surface/20 text-on-surface text-sm font-medium hover:border-on-surface/40 hover:bg-on-surface/5 transition"
              >
                💬 {tContact("openButton")}
              </button>
            </div>
          </div>
        </div>
      </article>

      {contactOpen && (
        <ContactModal
          shopId={shop.id}
          productId={product.id}
          productName={product.name}
          onClose={() => setContactOpen(false)}
        />
      )}
    </>
  )
}