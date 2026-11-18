// =============================================================================
// VALIDATION DES PRODUITS
// -----------------------------------------------------------------------------
// Fonction pure, testable. Le prix est optionnel : null signifie
// "prix sur demande" — comportement attendu pour les commerçants qui
// préfèrent être contactés (cf. cahier des charges).
// =============================================================================

import type { Currency, ProductStatus } from "@/lib/types/shop"

export interface ProductInput {
  name: string
  description: string | null
  price: number | null
  currency: Currency
  stock: number | null
  category_id: string | null
  status: ProductStatus
  is_featured: boolean
}

export interface ValidationResult {
  ok: boolean
  errors: Record<string, string>
  data?: ProductInput
}

const VALID_CURRENCIES: readonly Currency[] = ["XOF", "EUR", "USD"]
const VALID_STATUSES: readonly ProductStatus[] = ["draft", "published", "archived"]

export function validateProductInput(formData: FormData): ValidationResult {
  const errors: Record<string, string> = {}

  const name = String(formData.get("name") ?? "").trim()
  const descriptionRaw = String(formData.get("description") ?? "").trim()
  const priceRaw = String(formData.get("price") ?? "").trim()
  const currencyRaw = String(formData.get("currency") ?? "XOF")
  const stockRaw = String(formData.get("stock") ?? "").trim()
  const categoryRaw = String(formData.get("category_id") ?? "").trim()
  const statusRaw = String(formData.get("status") ?? "draft")
  const isFeatured = formData.get("is_featured") === "on"

  // Nom : 2 à 120 caractères
  if (name.length < 2) errors.name = "Le nom doit contenir au moins 2 caractères."
  else if (name.length > 120) errors.name = "Le nom ne doit pas dépasser 120 caractères."

  // Description : max 2000 caractères
  if (descriptionRaw.length > 2000) {
    errors.description = "La description ne doit pas dépasser 2000 caractères."
  }

  // Prix : optionnel. Si fourni, doit être un nombre >= 0.
  let price: number | null = null
  if (priceRaw !== "") {
    const parsed = Number(priceRaw)
    if (!Number.isFinite(parsed) || parsed < 0) {
      errors.price = "Le prix doit être un nombre positif (ou vide pour « sur demande »)."
    } else {
      price = parsed
    }
  }

  // Devise
  if (!VALID_CURRENCIES.includes(currencyRaw as Currency)) {
    errors.currency = "Devise invalide."
  }

  // Stock : optionnel, entier >= 0
  let stock: number | null = null
  if (stockRaw !== "") {
    const parsed = Number(stockRaw)
    if (!Number.isInteger(parsed) || parsed < 0) {
      errors.stock = "Le stock doit être un entier positif (ou vide)."
    } else {
      stock = parsed
    }
  }

  // Statut
  if (!VALID_STATUSES.includes(statusRaw as ProductStatus)) {
    errors.status = "Statut invalide."
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    errors: {},
    data: {
      name,
      description: descriptionRaw || null,
      price,
      currency: currencyRaw as Currency,
      stock,
      category_id: categoryRaw || null,
      status: statusRaw as ProductStatus,
      is_featured: isFeatured,
    },
  }
}