// =============================================================================
// FORMATAGE DE DATE RELATIVE
// -----------------------------------------------------------------------------
// Utilise Intl.RelativeTimeFormat (natif, zéro dépendance) pour produire
// « il y a 2 jours » / « 2 days ago » automatiquement selon la locale.
//
// Le choix de l'unité se fait par seuil : secondes → minutes → heures →
// jours → semaines → mois. Au-delà d'un mois, on bascule sur les mois.
// =============================================================================

import type { VitrineLocale } from "./load-messages"

export function formatRelativeTime(date: Date, locale: VitrineLocale): string {
  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHour = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHour / 24)
  const diffWeek = Math.round(diffDay / 7)
  const diffMonth = Math.round(diffDay / 30)

  const rtf = new Intl.RelativeTimeFormat(locale === "en" ? "en" : "fr", {
    numeric: "auto",
  })

  if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, "second")
  if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, "minute")
  if (Math.abs(diffHour) < 24) return rtf.format(-diffHour, "hour")
  if (Math.abs(diffDay) < 7) return rtf.format(-diffDay, "day")
  if (Math.abs(diffWeek) < 4) return rtf.format(-diffWeek, "week")
  return rtf.format(-diffMonth, "month")
}