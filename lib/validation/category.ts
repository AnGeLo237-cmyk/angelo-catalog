// =============================================================================
// VALIDATION DES CATÉGORIES
// -----------------------------------------------------------------------------
// Fonction pure, testable, réutilisée par createCategory et updateCategory.
// =============================================================================

export interface CategoryInput {
  name: string
}

export interface ValidationResult {
  ok: boolean
  errors: Record<string, string>
  data?: CategoryInput
}

export function validateCategoryInput(formData: FormData): ValidationResult {
  const errors: Record<string, string> = {}
  const name = String(formData.get("name") ?? "").trim()

  if (name.length < 2) {
    errors.name = "Le nom doit contenir au moins 2 caractères."
  } else if (name.length > 60) {
    errors.name = "Le nom ne doit pas dépasser 60 caractères."
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, errors: {}, data: { name } }
}