// =============================================================================
// PRIX — Affichage formaté selon la devise et la locale
// =============================================================================

"use client"

import { useLocale, useTranslations } from "next-intl"

export function PriceTag({
  price,
  currency,
  size = "md",
}: {
  price: number | null
  currency: string
  size?: "sm" | "md" | "lg"
}) {
  const locale = useLocale()
  const t = useTranslations("vitrine.product")

  if (price === null) {
    return (
      <span
        className={`italic text-on-surface-muted ${
          size === "lg" ? "text-lg" : size === "sm" ? "text-xs" : "text-sm"
        }`}
      >
        {t("priceOnRequest")}
      </span>
    )
  }

  let formatted: string
  try {
    formatted = new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price)
  } catch {
    formatted = `${price} ${currency}`
  }

  const cls =
    size === "lg"
      ? "text-2xl font-bold text-on-surface"
      : size === "sm"
      ? "text-xs font-medium text-on-surface"
      : "text-base font-semibold text-on-surface"

  return <span className={cls}>{formatted}</span>
}