// =============================================================================
// CART ITEM ROW — Ligne d'article dans le drawer
// -----------------------------------------------------------------------------

"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import type { CartItem } from "@/lib/cart/types"
import { maxQuantityFor } from "@/lib/cart/reducer"
import { useCart } from "@/lib/cart/use-cart"

function formatPrice(price: number | null, currency: string, locale: string) {
  if (price === null) {
    return locale === "en" ? "On request" : "Sur demande"
  }
  try {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price)
  } catch {
    return `${price} ${currency}`
  }
}

export function CartItemRow({
  item,
  shopSlug,
  locale,
}: {
  item: CartItem
  shopSlug: string
  locale: string
}) {
  const t = useTranslations("vitrine.cart")
  const cart = useCart()
  const maxQty = maxQuantityFor(item.stock)
  const atMax = item.quantity >= maxQty

  return (
    <li className="flex gap-3 py-3 border-b border-border last:border-0">
      {/* Image ou fallback initiale */}
      <Link
        href={`/${shopSlug}/${item.slug}`}
        className="w-16 h-16 rounded-lg overflow-hidden bg-surface-muted flex-shrink-0"
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <span className="text-xl font-semibold text-primary">
              {item.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </Link>

      {/* Infos + picker */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/${shopSlug}/${item.slug}`}
            className="text-sm font-medium text-on-surface line-clamp-2 hover:underline"
          >
            {item.name}
          </Link>
          <button
            type="button"
            onClick={() => cart.removeItem(item.productId)}
            aria-label={t("remove")}
            className="text-on-surface-muted hover:text-red-600 text-xs flex-shrink-0"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-on-surface-muted mt-0.5 tabular-nums">
          {formatPrice(item.price, item.currency, locale)}
        </p>

        <div className="flex items-center justify-between mt-2">
          {/* Picker +/- */}
          <div className="inline-flex items-center border border-border rounded-lg">
            <button
              type="button"
              onClick={() => cart.setQuantity(item.productId, item.quantity - 1)}
              aria-label={t("decrease")}
              className="w-7 h-7 flex items-center justify-center text-on-surface-muted hover:text-on-surface"
            >
              −
            </button>
            <span className="w-8 text-center text-xs font-medium tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => cart.setQuantity(item.productId, item.quantity + 1)}
              disabled={atMax}
              aria-label={t("increase")}
              className="w-7 h-7 flex items-center justify-center text-on-surface-muted hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>

          {/* Sous-total ligne */}
          <p className="text-sm font-semibold text-on-surface tabular-nums">
            {formatPrice(
              item.price === null ? null : item.price * item.quantity,
              item.currency,
              locale
            )}
          </p>
        </div>
      </div>
    </li>
  )
}