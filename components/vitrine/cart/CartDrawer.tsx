// =============================================================================
// CART DRAWER — Panneau latéral avec checkout robuste
// -----------------------------------------------------------------------------
// - Liste des articles avec picker +/-
// - Champ note libre (persisté dans le panier)
// - Sous-total
// - Bouton « Envoyer sur WhatsApp » → prepareCheckout (refetch serveur) puis :
//     · Si aucun changement → envoi direct via buildInvoiceMessage
//     · Si changements → modal de confirmation
// - Track `checkout_whatsapp` au moment de l'envoi effectif
// - Bouton « Vider le panier »
// =============================================================================

"use client"

import { useEffect, useState, useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useCart } from "@/lib/cart/use-cart"
import { buildInvoiceMessage } from "@/lib/cart/invoice"
import { trackEventClient } from "@/lib/analytics/track-client"
import {
  prepareCheckout,
  type CheckoutResult,
} from "@/app/[slug]/actions-checkout"
import { CartItemRow } from "./CartItemRow"
import { CheckoutConfirmModal } from "../cart/CheckoutConfirmModal"

export function CartDrawer({
  open,
  onClose,
  shopName,
  shopSlug,
  whatsappNumber,
}: {
  open: boolean
  onClose: () => void
  shopName: string
  shopSlug: string
  whatsappNumber: string
}) {
  const t = useTranslations("vitrine.cart")
  const locale = useLocale() as "fr" | "en"
  const cart = useCart()
  const [isPending, startTransition] = useTransition()
  const [checkoutData, setCheckoutData] = useState<CheckoutResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fermeture par Échap
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !checkoutData) onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onClose, checkoutData])

  // Scroll lock
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  function formatPrice(price: number, currency: string): string {
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

  // ---------------------------------------------------------------------------
  // Étape 1 : clic « Envoyer sur WhatsApp » → refetch serveur
  // ---------------------------------------------------------------------------
  function handleCheckout() {
    if (cart.state.items.length === 0) return
    setError(null)

    startTransition(async () => {
      const result = await prepareCheckout(
        shopSlug,
        cart.state.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          oldPrice: i.price,
        }))
      )

      if (!result.ok) {
        setError(result.error)
        return
      }

      const data = result.data
      const hasChanges =
        data.unavailable.length > 0 ||
        data.priceChanged.length > 0 ||
        data.stockAdjusted.length > 0

      if (hasChanges) {
        setCheckoutData(data)
      } else {
        sendToWhatsApp(data)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Étape 2 : envoi effectif
  // ---------------------------------------------------------------------------
  function sendToWhatsApp(data: CheckoutResult) {
    const baseUrl =
      typeof window !== "undefined" ? window.location.origin : ""

    const itemsForMessage = data.validatedItems.map((vi) => ({
      productId: vi.productId,
      slug: vi.slug,
      name: vi.name,
      price: vi.price,
      currency: vi.currency,
      imageUrl: null,
      stock: null,
      quantity: vi.quantity,
      addedAt: 0,
    }))

    const message = buildInvoiceMessage({
      shopName: data.shopName,
      shopSlug,
      items: itemsForMessage,
      note: cart.state.note,
      baseUrl,
      locale,
      date: new Date(),
    })

    const cleanPhone = data.whatsappNumber.replace(/[^\d]/g, "")
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")

    // ✅ Tracking checkout_whatsapp
    trackEventClient("checkout_whatsapp", data.shopId, null).catch(() => {})

    setCheckoutData(null)
    onClose()
  }

  function handleConfirmFromModal() {
    if (!checkoutData) return
    sendToWhatsApp(checkoutData)
  }

  function handleClear() {
    if (confirm(t("clearConfirm"))) {
      cart.clear()
    }
  }

  if (!open) return null

  const isEmpty = cart.state.items.length === 0
  const currency = cart.state.currency ?? "XOF"

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="fixed inset-0 z-50"
        onClick={onClose}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          aria-hidden="true"
        />

        {/* Drawer */}
        <aside
          className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-surface shadow-xl flex flex-col animate-slide-in-right"
          onClick={(e) => e.stopPropagation()}
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
            maxWidth: "100vw",
          }}
        >
          {/* En-tête */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <div>
              <h2 id="cart-title" className="text-base font-bold text-on-surface">
                {t("title")}
              </h2>
              <p className="text-xs text-on-surface-muted">
                {t("itemCount", { count: cart.itemCount })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="text-on-surface-muted hover:text-on-surface text-lg p-1"
            >
              ✕
            </button>
          </header>

          {/* Contenu */}
          {isEmpty ? (
            <div className="flex-1 flex items-center justify-center px-6 text-center">
              <div>
                <p className="text-4xl mb-3">🛒</p>
                <p className="text-sm font-medium text-on-surface">
                  {t("empty")}
                </p>
                <p className="text-xs text-on-surface-muted mt-1">
                  {t("emptyHint")}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4">
                <ul>
                  {cart.state.items.map((item) => (
                    <CartItemRow
                      key={item.productId}
                      item={item}
                      shopSlug={shopSlug}
                      locale={locale}
                    />
                  ))}
                </ul>

                {/* Note */}
                <div className="py-4 border-t border-border">
                  <label className="block">
                    <span className="block text-xs font-medium mb-1 text-on-surface-muted">
                      {t("note")}
                    </span>
                    <textarea
                      value={cart.state.note}
                      onChange={(e) => cart.setNote(e.target.value)}
                      rows={2}
                      maxLength={300}
                      placeholder={t("notePlaceholder")}
                      className="w-full text-xs border rounded-lg px-3 py-2 bg-surface text-on-surface border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <span className="block text-[10px] text-on-surface-muted mt-1">
                      {t("noteHint")}
                    </span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <footer className="px-4 py-3 border-t border-border bg-surface-muted flex-shrink-0 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-on-surface">
                    {t("subtotal")}
                  </span>
                  <span className="text-base font-bold text-on-surface tabular-nums">
                    {formatPrice(cart.subtotal, currency)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#1ebe57] shadow-sm whatsapp-btn disabled:opacity-60 disabled:cursor-wait"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                  </svg>
                  {isPending ? t("checking") : t("checkout")}
                </button>

                {error && (
                  <p role="alert" className="text-xs text-red-600 text-center">
                    {error}
                  </p>
                )}

                <p className="text-[10px] text-on-surface-muted text-center">
                  {t("checkoutHint")}
                </p>

                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full text-xs text-red-600 hover:underline py-1"
                >
                  {t("clear")}
                </button>
              </footer>
            </>
          )}
        </aside>
      </div>

      {checkoutData && (
        <CheckoutConfirmModal
          data={checkoutData}
          onConfirm={handleConfirmFromModal}
          onCancel={() => setCheckoutData(null)}
        />
      )}
    </>
  )
}