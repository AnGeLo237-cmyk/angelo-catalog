// =============================================================================
// SLUGIFY — Génération d'un slug URL-friendly à partir d'un texte
// -----------------------------------------------------------------------------
// Cette fonction est PURE : elle ne fait aucune requête, ne lit aucune variable
// globale, et retourne toujours le même résultat pour la même entrée.
// Cela la rend facile à tester unitairement et à utiliser partout.
//
// Règles appliquées :
//   1. Décomposition Unicode (NFD) pour séparer les accents des lettres
//   2. Suppression des marques diacritiques (accents, tréma, cédille…)
//   3. Remplacement manuel des ligatures françaises (œ, æ, ß)
//   4. Minuscules
//   5. Remplacement des apostrophes par rien (l'élégance → lelegance → l-elegance)
//   6. Remplacement de tout caractère non alphanumérique par un tiret
//   7. Fusion des tirets consécutifs
//   8. Suppression des tirets en début et fin
//   9. Limitation de la longueur (par défaut 80 caractères)
// =============================================================================

export interface SlugifyOptions {
  /** Longueur maximale du slug (par défaut 80) */
  maxLength?: number
  /** Caractère de séparation (par défaut '-') */
  separator?: string
}

export function slugify(input: string, options: SlugifyOptions = {}): string {
  const { maxLength = 80, separator = "-" } = options

  // Étape 0 : garde-fou sur l'entrée
  if (!input || typeof input !== "string") return ""

  // Étape 1 : remplacement manuel des ligatures (avant la normalisation NFD,
  // car NFD ne décompose pas les ligatures comme œ ou æ)
  let result = input
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "ae")
    .replace(/ß/g, "ss")

  // Étape 2 : normalisation NFD + suppression des accents
  // "é" devient "e" + accent combinant, puis on retire les accents.
  result = result
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  // Étape 3 : remplacement des apostrophes typographiques et droites par rien
  // On le fait AVANT le remplacement par séparateur, sinon "l'élégance"
  // deviendrait "l-elegance" au lieu de "lelegance" ou "l-elegance".
  // On garde le tiret pour lisibilité : "l-elegance" est plus lisible.
  result = result.replace(/['’]/g, separator)

  // Étape 4 : minuscules
  result = result.toLowerCase()

  // Étape 5 : remplacement de tout ce qui n'est pas lettre/chiffre par le séparateur
  // \p{L} = lettres Unicode, \p{N} = nombres, le flag u active Unicode
  result = result.replace(/[^\p{L}\p{N}]+/gu, separator)

  // Étape 6 : fusion des séparateurs consécutifs (ex: "--" → "-")
  const escapedSep = separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  result = result.replace(new RegExp(`${escapedSep}+`, "g"), separator)

  // Étape 7 : suppression des séparateurs en début et fin
  result = result.replace(
    new RegExp(`^${escapedSep}+|${escapedSep}+$`, "g"),
    ""
  )

  // Étape 8 : troncature à maxLength, puis re-suppression du séparateur final
  // (la troncature peut couper au milieu d'un mot, donc on nettoie la fin)
  if (result.length > maxLength) {
    result = result.slice(0, maxLength).replace(
      new RegExp(`${escapedSep}+$`),
      ""
    )
  }

  // Étape 9 : cas limite — si le résultat est vide (ex: nom = "###"), on
  // retourne une chaîne vide que l'appelant devra gérer.
  return result
}