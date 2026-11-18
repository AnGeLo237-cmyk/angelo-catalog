// =============================================================================
// VALIDATION DES DONNÉES DE BOUTIQUE
// -----------------------------------------------------------------------------
// Fonction pure, testable unitairement avec Vitest, réutilisée par le
// Server Action createShop (onboarding) et — plus tard — par updateShop.
//
// ⚠️ Ce fichier ne contient QUE de la validation. Les types métier
//    (ProductImage, ProductImageWithUrl, etc.) appartiennent à
//    src/lib/types/shop.ts, pas ici.
// =============================================================================

export interface ShopInput {
  name: string
  description: string | null
  whatsapp_number: string
  contact_email: string | null
  language: "fr" | "en"
  theme_mode: "light" | "dark" | "system"
  primary_color: string
  catalog_layout: "grid-2" | "grid-3" | "grid-4" | "list"
}

export interface ValidationResult {
  ok: boolean
  errors: Record<string, string>
  data?: ShopInput
}

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
// Format international simple : + suivi de 6 à 15 chiffres, avec espaces
// ou tirets tolérés. On ne valide pas le pays (cela relèverait d'une lib
// téléphonique), mais on empêche les cas aberrants.
const PHONE = /^\+[0-9\s-]{6,18}$/

export function validateShopInput(formData: FormData): ValidationResult {
  const errors: Record<string, string> = {}

  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const whatsapp_number = String(formData.get("whatsapp_number") ?? "").trim()
  const contact_email = String(formData.get("contact_email") ?? "").trim()
  const language = String(formData.get("language") ?? "fr")
  const theme_mode = String(formData.get("theme_mode") ?? "light")
  const primary_color = String(formData.get("primary_color") ?? "#3ecf8e")
  const catalog_layout = String(formData.get("catalog_layout") ?? "grid-3")

  // Nom
  if (name.length < 2) errors.name = "Le nom doit contenir au moins 2 caractères."
  else if (name.length > 100) errors.name = "Le nom ne doit pas dépasser 100 caractères."

  // Description
  if (description.length > 500) {
    errors.description = "La description ne doit pas dépasser 500 caractères."
  }

  // WhatsApp
  if (!whatsapp_number) {
    errors.whatsapp_number = "Le numéro WhatsApp est obligatoire."
  } else if (!PHONE.test(whatsapp_number)) {
    errors.whatsapp_number =
      "Format attendu : +237 6XX XXX XXX (indicatif international requis)."
  }

  // Email (facultatif, mais si présent doit être valide)
  if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
    errors.contact_email = "Adresse email invalide."
  }

  // Enums
  if (!["fr", "en"].includes(language)) errors.language = "Langue invalide."
  if (!["light", "dark", "system"].includes(theme_mode)) {
    errors.theme_mode = "Mode invalide."
  }
  if (!["grid-2", "grid-3", "grid-4", "list"].includes(catalog_layout)) {
    errors.catalog_layout = "Disposition invalide."
  }

  // Couleur
  if (!HEX_COLOR.test(primary_color)) {
    errors.primary_color = "Couleur invalide (format hexadécimal attendu)."
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    errors: {},
    data: {
      name,
      description: description || null,
      whatsapp_number,
      contact_email: contact_email || null,
      language: language as ShopInput["language"],
      theme_mode: theme_mode as ShopInput["theme_mode"],
      primary_color,
      catalog_layout: catalog_layout as ShopInput["catalog_layout"],
    },
  }
}