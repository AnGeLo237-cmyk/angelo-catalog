// =============================================================================
// VALIDATION DES DEMANDES DE CONTACT
// -----------------------------------------------------------------------------
// Règle : au moins un canal de réponse (email OU téléphone) doit être fourni.
// Le message est obligatoire, borné à 1000 caractères.
// =============================================================================

export interface InquiryInput {
  sender_name: string | null
  sender_email: string | null
  sender_phone: string | null
  message: string
}

export interface ValidationResult {
  ok: boolean
  errors: Record<string, string>
  data?: InquiryInput
}

const MAX_MESSAGE_LENGTH = 1000
const MAX_NAME_LENGTH = 80
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Format international simple (indicatif obligatoire)
const PHONE_REGEX = /^\+[0-9\s-]{6,18}$/

export function validateInquiryInput(formData: FormData): ValidationResult {
  const errors: Record<string, string> = {}

  const sender_name = String(formData.get("sender_name") ?? "").trim()
  const sender_email = String(formData.get("sender_email") ?? "").trim()
  const sender_phone = String(formData.get("sender_phone") ?? "").trim()
  const message = String(formData.get("message") ?? "").trim()

  // Nom (facultatif)
  if (sender_name.length > MAX_NAME_LENGTH) {
    errors.sender_name = "Le nom ne doit pas dépasser 80 caractères."
  }

  // Email (facultatif, mais valide si fourni)
  if (sender_email && !EMAIL_REGEX.test(sender_email)) {
    errors.sender_email = "Adresse email invalide."
  }

  // Téléphone (facultatif, mais valide si fourni)
  if (sender_phone && !PHONE_REGEX.test(sender_phone)) {
    errors.sender_phone =
      "Format attendu : +237 6XX XXX XXX (indicatif international requis)."
  }

  // Au moins un canal
  if (!sender_email && !sender_phone) {
    errors.sender_email = "Fournissez au moins un email ou un téléphone."
    errors.sender_phone = "Fournissez au moins un email ou un téléphone."
  }

  // Message (obligatoire)
  if (message.length < 10) {
    errors.message = "Le message doit contenir au moins 10 caractères."
  } else if (message.length > MAX_MESSAGE_LENGTH) {
    errors.message = `Le message ne doit pas dépasser ${MAX_MESSAGE_LENGTH} caractères.`
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    errors: {},
    data: {
      sender_name: sender_name || null,
      sender_email: sender_email || null,
      sender_phone: sender_phone || null,
      message,
    },
  }
}