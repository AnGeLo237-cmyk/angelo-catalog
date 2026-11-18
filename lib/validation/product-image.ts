// =============================================================================
// VALIDATION DES IMAGES PRODUIT
// -----------------------------------------------------------------------------
// Constantes exportées et utilisables côté client (validation avant upload)
// et côté serveur (sécurité en profondeur).
// =============================================================================

export const MAX_IMAGES_PER_PRODUCT = 5
export const MAX_RAW_FILE_SIZE_MB = 10
export const MAX_ALT_TEXT_LENGTH = 200

export interface ImageValidationResult {
  ok: boolean
  reason?: string
}

/**
 * Vérifie qu'un fichier peut être uploadé comme image de produit.
 * Ne teste pas la décodabilité (faite par validateImageFile de compress-image).
 */
export function validateImageForUpload(
  file: File,
  currentImageCount: number
): ImageValidationResult {
  if (currentImageCount >= MAX_IMAGES_PER_PRODUCT) {
    return {
      ok: false,
      reason: `Maximum ${MAX_IMAGES_PER_PRODUCT} images par produit.`,
    }
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, reason: "Le fichier doit être une image." }
  }
  if (file.size > MAX_RAW_FILE_SIZE_MB * 1024 * 1024) {
    return {
      ok: false,
      reason: `L'image ne doit pas dépasser ${MAX_RAW_FILE_SIZE_MB} Mo avant compression.`,
    }
  }
  return { ok: true }
}