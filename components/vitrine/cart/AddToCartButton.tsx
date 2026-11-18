// =============================================================================
// ADD TO CART BUTTON — Bouton réutilisable
// -----------------------------------------------------------------------------
// - variant "card" : icône + texte court, positionné sur la carte produit
// - variant "detail" : icône + texte complet, pleine largeur sur la fiche
// - Empêche la navigation si le bouton est dans un <Link> parent
// - Feedback visuel « Ajouté » pendant 1,5 s
// - Messages d'erreur inline (devise mixte, stock épuisé…)
// - Désactivé si rupture de stock
// - Track `cart_add` à chaque ajout réussi
// =============================================================================

"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { useCart } from "@/lib/cart/use-cart"
import type { ProductForCart, CartError } from "@/lib/cart/types"
import { trackEventClient } from "@/lib/analytics/track-client"

function CartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

export function AddToCartButton({
  product,
  variant = "card",
}: {
  product: ProductForCart
  variant?: "card" | "detail"
}) {
  const t = useTranslations("vitrine.cart")
  const cart = useCart()
  const [feedback, setFeedback] = useState<"idle" | "added" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string>("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isOutOfStock = product.stock !== null && product.stock <= 0

  // Nettoyage du timer au démontage
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function showError(code: string) {
    const map: Record<string, string> = {
      currency_mismatch: t("errors.currency_mismatch", {
        current: cart.state.currency ?? "",
        item: product.currency,
      }),
      max_lines_reached: t("errors.max_lines_reached"),
      out_of_stock: t("errors.out_of_stock"),
      invalid_quantity: t("errors.invalid_quantity"),
    }
    setErrorMsg(map[code] ?? t("errors.invalid_quantity"))
    setFeedback("error")
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setFeedback("idle")
      setErrorMsg("")
    }, 3000)
  }

  function handleClick(e: React.MouseEvent) {
    // Empêche la navigation si le bouton est dans un <Link>
    e.preventDefault()
    e.stopPropagation()

    const result = cart.addItem(product, 1)
    if (result.ok) {
      setFeedback("added")
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setFeedback("idle"), 1500)

      // ✅ Tracking cart_add (fire-and-forget)
      trackEventClient("cart_add", cart.shopId, product.productId).catch(
        () => {}
      )
    } else {
      showError(result.error as CartError)
    }
  }

  if (isOutOfStock) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex items-center justify-center gap-2 rounded-lg opacity-60 cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 ${
          variant === "detail"
            ? "w-full px-5 py-3 text-sm"
            : "px-3 py-2 text-xs"
        }`}
      >
        {t("outOfStock")}
      </button>
    )
  }

  const label =
    feedback === "added"
      ? t("added")
      : feedback === "error"
      ? errorMsg
      : t("addToCart")

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={t("addToCart")}
        className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all ${
          feedback === "added"
            ? "bg-green-600 text-white"
            : feedback === "error"
            ? "bg-red-50 border-2 border-red-300 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-200"
            : "border-2 border-primary text-primary bg-primary/5 hover:bg-primary/10"
        }`}
      >
        <CartIcon />
        <span className="text-center leading-tight">{label}</span>
      </button>
    )
  }

  // variant "card"
  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        aria-label={t("addToCart")}
        className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all ${
          feedback === "added"
            ? "bg-green-600 text-white"
            : feedback === "error"
            ? "bg-red-600 text-white"
            : "bg-surface text-on-surface border border-border hover:border-primary hover:text-primary"
        }`}
      >
        <CartIcon size={14} />
        <span className="hidden sm:inline">
          {feedback === "added" ? "✓" : feedback === "error" ? "!" : ""}
        </span>
      </button>

      {feedback === "error" && errorMsg && (
        <div
          role="alert"
          className="absolute bottom-full right-0 mb-2 w-56 p-2 rounded-lg bg-red-600 text-white text-[11px] shadow-lg z-30 pointer-events-none"
        >
          {errorMsg}
        </div>
      )}
    </div>
  )
}