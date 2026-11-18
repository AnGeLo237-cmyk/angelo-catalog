// =============================================================================
// SESSION ANALYTICS — Cookie persistant côté client
// -----------------------------------------------------------------------------
// Un UUID stable par visiteur, stocké dans un cookie 30 jours.
// Sert à distinguer les visites sans stocker d'information personnelle.
// =============================================================================

const COOKIE_NAME = "analytics_sid"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 jours

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)")
  )
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

/**
 * Retourne l'ID de session existant, ou en crée un nouveau si absent.
 * Client-side uniquement (accède à document.cookie).
 */
export function getOrCreateSessionId(): string {
  const existing = getCookie(COOKIE_NAME)
  if (existing) return existing
  const newId = crypto.randomUUID()
  setCookie(COOKIE_NAME, newId, COOKIE_MAX_AGE)
  return newId
}