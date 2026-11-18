// =============================================================================
// CHARGEMENT DES MESSAGES POUR LA VITRINE
// -----------------------------------------------------------------------------
// La vitrine utilise la langue de la boutique visitée (shop.language),
// pas celle du visiteur connecté. On charge donc les messages statiquement
// selon cette valeur.
// =============================================================================

import frMessages from "../../messages/fr.json"
import enMessages from "../../messages/en.json"

export type VitrineLocale = "fr" | "en"

export function loadMessages(locale: VitrineLocale) {
  return locale === "en" ? enMessages : frMessages
}