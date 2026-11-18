// =============================================================================
// TYPES PARTAGÉS — BOUTIQUE, CATALOGUE, IMAGES
// -----------------------------------------------------------------------------
// Types centralisés pour éviter la duplication et l'usage de `any`.
// Les unions (ThemeMode, CatalogLayout, etc.) correspondent exactement aux
// types énumérés PostgreSQL, garantissant la cohérence base ↔ code.
//
// ⚠️ Règle : les types métier vivent ICI, pas dans les fichiers de validation.
// =============================================================================

// --- Boutique -----------------------------------------------------------------
export type ShopLanguage = "fr" | "en"
export type ThemeMode = "light" | "dark" | "system"
export type CatalogLayout = "grid-2" | "grid-3" | "grid-4" | "list"

export interface ShopSettings {
  theme_mode: ThemeMode
  primary_color: string
  language: ShopLanguage
  catalog_layout: CatalogLayout
}

export interface ShopSummary {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string
  theme_mode: ThemeMode
  language: ShopLanguage
  catalog_layout: CatalogLayout
}

// --- Catégories ---------------------------------------------------------------
export interface Category {
  id: string
  shop_id: string
  name: string
  slug: string
  position: number
  created_at: string
  product_count?: number
}

// --- Produits -----------------------------------------------------------------
export type ProductStatus = "draft" | "published" | "archived"
export type Currency = "XOF" | "EUR" | "USD"

export interface Product {
  id: string
  shop_id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  price: number | null
  currency: Currency
  stock: number | null
  status: ProductStatus
  is_featured: boolean
  created_at: string
  updated_at: string
}

/**
 * Produit enrichi pour l'affichage en liste.
 * - `category_name` : nom de la catégorie (dénormalisé pour éviter un 2ᵉ map)
 * - `main_image_url` : URL publique de l'image en position 0 (ou null si aucune)
 */
export interface ProductWithCategory extends Product {
  category_name: string | null
  main_image_url: string | null
}

// --- Images produits ----------------------------------------------------------
export interface ProductImage {
  id: string
  product_id: string
  storage_path: string
  alt_text: string | null
  position: number
  created_at: string
}

/**
 * Image enrichie avec son URL publique, prête à être affichée côté client.
 * `public_url` est dérivée de `storage_path` via `getPublicUrl()`.
 */
export interface ProductImageWithUrl extends ProductImage {
  public_url: string
}

/** Demande de contact reçue via la vitrine */
export interface Inquiry {
  id: string
  shop_id: string
  product_id: string | null
  sender_name: string | null
  sender_email: string | null
  sender_phone: string | null
  message: string
  is_read: boolean
  created_at: string
}

/** Demande enrichie pour l'affichage dashboard */
export interface InquiryWithProduct extends Inquiry {
  product_name: string | null
  product_slug: string | null
}

/** Événement analytics tracké par la vitrine */
export type AnalyticsEventType =
  | "view"                 // Fiche produit consultée
  | "whatsapp_click"       // Clic bouton WhatsApp (par produit)
  | "contact_submit"       // Formulaire de contact envoyé
  | "cart_add"             // Produit ajouté au panier
  | "checkout_whatsapp"    // Envoi du récapitulatif via WhatsApp