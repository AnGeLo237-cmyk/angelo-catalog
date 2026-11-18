// =============================================================================
// SLUGS RÉSERVÉS — Interdits pour les boutiques
// -----------------------------------------------------------------------------
// Ces slugs sont déjà utilisés par l'infrastructure Next.js ou par les routes
// applicatives. Si un commerçant crée une boutique nommée "Dashboard" ou
// "Admin", son slug entrerait en collision avec nos pages.
// =============================================================================

export const RESERVED_SLUGS = new Set([
  // Routes applicatives
  "dashboard",
  "login",
  "register",
  "signup",
  "logout",
  "auth",
  "api",
  // Routes système Next.js
  "_next",
  "public",
  "static",
  "favicon",
  // Futures routes prévisibles
  "admin",
  "help",
  "support",
  "about",
  "contact",
  "terms",
  "privacy",
  "shop",
  "shops",
  "product",
  "products",
  "catalog",
  "catalogs",
  "boutique",
  "boutiques",
])

/**
 * Vérifie si un slug est réservé. À appeler AVANT generateUniqueSlug().
 * Ajoute un préfixe "b-" si réservé, ce qui évite de rejeter le formulaire.
 */
export function ensureNotReserved(slug: string): string {
  if (!slug) return slug
  return RESERVED_SLUGS.has(slug) ? `b-${slug}` : slug
}