// =============================================================================
// BOUTON WHATSAPP — Ouvre wa.me avec message pré-rempli
// -----------------------------------------------------------------------------
// Le tracking d'événements sera ajouté en Phase 9.
// =============================================================================

"use client"

import { useTranslations } from "next-intl"
import { trackEventClient } from "@/lib/analytics/track-client"

export function WhatsAppButton({
  phoneNumber,
  productName,
  productId,
  shopId,
  variant = "primary",
  fullWidth = false,
}: {
  phoneNumber: string
  productName?: string
  productId?: string
  shopId?: string
  variant?: "primary" | "outline"
  fullWidth?: boolean
}) {
  const t = useTranslations("vitrine.product")
  const cleanPhone = phoneNumber.replace(/[^\d]/g, "")

  const message = productName
    ? t("whatsappMessage", { product: productName })
    : t("contactWhatsApp")

  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

  function handleClick() {
    // Fire-and-forget : le lien s'ouvre dans un nouvel onglet, donc
    // l'insertion analytics peut se terminer sans interférer.
    if (shopId) {
      trackEventClient("whatsapp_click", shopId, productId ?? null)
    }
  }

  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors"
  const styles =
    variant === "primary"
      ? "bg-[#25D366] text-white hover:bg-[#1ebe57] shadow-sm whatsapp-btn"
      : "border-2 border-on-surface/20 text-on-surface hover:border-on-surface/40"
  const size = "px-5 py-3 text-sm"
  const width = fullWidth ? "w-full" : ""

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      data-testid="whatsapp-button"
      className={`${base} ${styles} ${size} ${width}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        {/* icône WhatsApp inchangée */}
      </svg>
      {t("contactWhatsApp")}
    </a>
  )
}