// =============================================================================
// CART BUTTON — Bouton flottant avec badge
// -----------------------------------------------------------------------------
// N'apparaît qu'après hydratation (évite le flash 0 → N) et quand le panier
// contient au moins un article. Masqué quand le drawer est ouvert.
// =============================================================================

"use client"

import { useTranslations } from "next-intl"
import { useCart } from "@/lib/cart/use-cart"

export function CartButton({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations("vitrine.cart")
  const cart = useCart()

  // Avant hydratation, rien ne s'affiche (évite le mismatch SSR/CSR)
  if (!cart.hydrated || cart.itemCount === 0) return null

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t("openCart")}
      className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 px-4 py-3 rounded-full
                 bg-primary text-white shadow-lg hover:shadow-xl hover:opacity-90
                 transition-all animate-fade-in-up"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <svg
        width="20"
        height="20"
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
      <span className="text-sm font-semibold tabular-nums">
        {cart.itemCount > 99 ? "99+" : cart.itemCount}
      </span>
    </button>
  )
}