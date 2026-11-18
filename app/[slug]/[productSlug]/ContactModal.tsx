// =============================================================================
// MODALE DE CONTACT — Formulaire public
// -----------------------------------------------------------------------------
// ⚠️ Correctif React 19 : `showSuccess` est DÉRIVÉ de `state.success`,
//    pas maintenu dans un state séparé. Plus de `setState` dans un effet.
//
//    Le useEffect ne contient QUE le timer de fermeture automatique
//    (effet légitime : setTimeout est un système externe).
//
//    L'état `isPending` de useActionState gère le feedback de chargement,
//    sans state supplémentaire.
// =============================================================================

"use client"

import { useActionState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { createInquiry } from "./actions-inquiry"
import { getOrCreateSessionId } from "@/lib/analytics/session"


type ActionResult = { success: true } | { success: false; error: string }

export function ContactModal({
  shopId,
  productId,
  productName,
  onClose,
}: {
  shopId: string
  productId: string
  productName: string
  onClose: () => void
}) {
  const t = useTranslations("vitrine.contact")
  const dialogRef = useRef<HTMLDivElement>(null)

  // useActionState : (prev, formData) => Promise<ActionResult>
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => {
      // Injecte le session_id avant l'envoi (client-side)
      formData.set("session_id", getOrCreateSessionId())
      return createInquiry(shopId, productId, formData)
    },
    null
  )

  // ✅ Dérivé directement de state, PAS de setState séparé
  const showSuccess = state?.success === true

  // Effet légitime : timer de fermeture automatique après succès.
  // Aucun setState ici, uniquement un setTimeout (système externe).
  useEffect(() => {
    if (!showSuccess) return
    const timer = setTimeout(() => onClose(), 2500)
    return () => clearTimeout(timer)
  }, [showSuccess, onClose])

  // Effet légitime : fermeture avec Échap (écouteur externe)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  const label = "block text-sm font-medium mb-1 text-on-surface"
  const field =
    "w-full border rounded-lg px-3 py-2 bg-surface text-on-surface border-border focus:outline-none focus:ring-2 focus:ring-primary/50"

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full sm:max-w-lg bg-surface rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {showSuccess ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-2">
              {t("successTitle")}
            </h2>
            <p className="text-sm text-on-surface-muted">{t("successBody")}</p>
          </div>
        ) : (
          <form action={formAction} className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="contact-title"
                  className="text-lg font-bold text-on-surface"
                >
                  {t("title")}
                </h2>
                <p className="text-sm text-on-surface-muted mt-1">
                  {t("subtitle")}
                </p>
                <p className="text-xs text-primary font-medium mt-2">
                  {t("aboutProduct", { product: productName })}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("close")}
                className="text-on-surface-muted hover:text-on-surface shrink-0"
              >
                ✕
              </button>
            </div>

            <label className="block">
              <span className={label}>{t("nameLabel")}</span>
              <input
                type="text"
                name="sender_name"
                maxLength={80}
                placeholder={t("namePlaceholder")}
                disabled={isPending}
                className={field}
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className={label}>{t("emailLabel")}</span>
                <input
                  type="email"
                  name="sender_email"
                  autoComplete="email"
                  disabled={isPending}
                  className={field}
                />
              </label>
              <label className="block">
                <span className={label}>{t("phoneLabel")}</span>
                <input
                  type="tel"
                  name="sender_phone"
                  autoComplete="tel"
                  placeholder="+237 6XX XXX XXX"
                  disabled={isPending}
                  className={field}
                />
              </label>
            </div>
            <p className="text-xs text-on-surface-muted -mt-1">
              {t("contactHint")}
            </p>

            <label className="block">
              <span className={label}>{t("messageLabel")} *</span>
              <textarea
                name="message"
                required
                rows={4}
                maxLength={1000}
                placeholder={t("messagePlaceholder")}
                disabled={isPending}
                className={field}
              />
            </label>

            {state && !state.success && (
              <p role="alert" className="text-sm text-red-600">
                {state.error === "Champs invalides."
                  ? t("error")
                  : state.error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2 rounded-lg text-sm text-on-surface-muted hover:bg-surface-muted"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? t("sending") : t("send")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}