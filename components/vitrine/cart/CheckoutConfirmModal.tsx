// =============================================================================
// CHECKOUT CONFIRM MODAL — Affiche les changements détectés
// -----------------------------------------------------------------------------
// Affiché uniquement si au moins un changement est détecté (prix, stock,
// indisponibilité). L'utilisateur peut :
//   - Confirmer : le message est généré avec les données à jour
//   - Annuler : retour au drawer sans envoi
// =============================================================================

"use client"

import { useLocale, useTranslations } from "next-intl"
import type { CheckoutResult } from "@/app/[slug]/actions-checkout"

function formatPrice(
  price: number | null,
  currency: string,
  locale: string
): string {
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

export function CheckoutConfirmModal({
  data,
  onConfirm,
  onCancel,
}: {
  data: CheckoutResult
  onConfirm: () => void
  onCancel: () => void
}) {
  const t = useTranslations("vitrine.cart.checkoutModal")
  const locale = useLocale() as "fr" | "en"

  const hasChanges =
    data.unavailable.length > 0 ||
    data.priceChanged.length > 0 ||
    data.stockAdjusted.length > 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-on-surface">
              {t("title")}
            </h2>
            <p className="text-sm text-on-surface-muted mt-1">
              {t("subtitle")}
            </p>
          </div>

          {/* Produits retirés */}
          {data.unavailable.length > 0 && (
            <section className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3">
              <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                {t("unavailableTitle")}
              </p>
              <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                {data.unavailable.map((id) => (
                  <li key={id} className="flex items-start gap-2">
                    <span aria-hidden="true">✕</span>
                    <span>{t("unavailableItem")}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Prix modifiés */}
          {data.priceChanged.length > 0 && (
            <section className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 p-3">
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">
                {t("priceChangedTitle")}
              </p>
              <ul className="space-y-1.5 text-sm text-orange-800 dark:text-orange-200">
                {data.priceChanged.map((pc) => (
                  <li key={pc.productId}>
                    <p className="font-medium">{pc.productName}</p>
                    <p className="text-xs opacity-80 tabular-nums">
                      <span className="line-through">
                        {formatPrice(pc.oldPrice, "XOF", locale)}
                      </span>
                      {" → "}
                      <span className="font-semibold">
                        {formatPrice(pc.newPrice, "XOF", locale)}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Stock ajusté */}
          {data.stockAdjusted.length > 0 && (
            <section className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/40 p-3">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                {t("stockAdjustedTitle")}
              </p>
              <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                {data.stockAdjusted.map((sa) => (
                  <li key={sa.productId}>
                    <span className="font-medium">{sa.productName}</span>
                    {" — "}
                    {t("stockAdjustedDetail", {
                      requested: sa.requestedQty,
                      available: sa.availableQty,
                    })}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Info : le message utilisera les données actuelles */}
          {hasChanges && (
            <p className="text-xs text-on-surface-muted">
              {t("confirmHint")}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-border text-on-surface hover:bg-surface-muted"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#1ebe57] whatsapp-btn"
            >
              {t("confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}