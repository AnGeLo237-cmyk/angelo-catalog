// =============================================================================
// INVOICE — Génération du message WhatsApp (récapitulatif de commande)
// -----------------------------------------------------------------------------
// Fonction PURE : aucune dépendance à window, Date.now() implicite ou autre.
// Le `date` est passé en paramètre pour rester déterministe et testable.
//
// Format :
//   *Récapitulatif de commande*
//   Boutique Marie — 14 nov. 2026
//
//   *Articles :*
//   • 2× Robe rouge — 30 000 XOF
//     https://exemple.com/boutique-marie/robe-rouge
//   • 1× Sac cuir — 15 000 XOF
//     https://exemple.com/boutique-marie/sac-cuir
//
//   *Total : 45 000 XOF*
//
//   *Note :* Livraison avant vendredi.
// =============================================================================

import type { CartItem } from "./types"
import type { Currency } from "@/lib/types/shop"

export interface InvoiceOptions {
  shopName: string
  shopSlug: string
  items: CartItem[]
  note: string
  baseUrl: string
  locale: "fr" | "en"
  date: Date
}

function formatPrice(
  price: number | null,
  currency: string,
  locale: "fr" | "en"
): string {
  if (price === null) {
    return locale === "en" ? "Price on request" : "Prix sur demande"
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

function formatDate(date: Date, locale: "fr" | "en"): string {
  try {
    return date.toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

export function buildInvoiceMessage(opts: InvoiceOptions): string {
  const { shopName, shopSlug, items, note, baseUrl, locale, date } = opts

  if (items.length === 0) return ""

  const dateStr = formatDate(date, locale)

  const header =
    locale === "en"
      ? `*Order summary*\n${shopName} — ${dateStr}`
      : `*Récapitulatif de commande*\n${shopName} — ${dateStr}`

  const itemsLabel = locale === "en" ? "*Items:*" : "*Articles :*"

  const itemLines = items.map((item) => {
    const price = formatPrice(item.price, item.currency, locale)
    const url = `${baseUrl}/${shopSlug}/${item.slug}`
    return `• ${item.quantity}× ${item.name} — ${price}\n   ${url}`
  })

  const subtotal = items.reduce(
    (sum, i) => sum + (i.price ?? 0) * i.quantity,
    0
  )
  const currency: Currency = items[0].currency
  const totalLabel = locale === "en" ? "*Total*" : "*Total*"
  const totalLine = `${totalLabel} : ${formatPrice(subtotal, currency, locale)}`

  const noteLabel = locale === "en" ? "*Note:*" : "*Note :*"
  const noteBlock = note.trim() ? `\n\n${noteLabel} ${note.trim()}` : ""

  return [header, "", itemsLabel, ...itemLines, "", totalLine].join("\n") + noteBlock
}