#!/usr/bin/env node
// =============================================================================
// check-strings.mjs
// -----------------------------------------------------------------------------
// Détecte les chaînes françaises codées en dur dans les composants .tsx.
//
// ✅ Cross-platform (Windows/Mac/Linux).
// ✅ Détecte automatiquement la structure : avec ou sans dossier `src/`.
// ✅ Ignore node_modules, .next, scripts, tests, etc.
//
// Usage : node check-strings.mjs
//     ou : npm run check:strings
// =============================================================================

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs"
import { join, relative } from "node:path"

// -----------------------------------------------------------------------------
// 1. Détermine la racine du code source à scanner
// -----------------------------------------------------------------------------
// Priorité à `src/` s'il existe (structure Next.js courante), sinon racine.
const PROJECT_ROOT = process.cwd()
const SRC_DIR = join(PROJECT_ROOT, "src")
const SCAN_ROOT = existsSync(SRC_DIR) ? SRC_DIR : PROJECT_ROOT

// -----------------------------------------------------------------------------
// 2. Dossiers et fichiers à exclure
// -----------------------------------------------------------------------------
const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "build",
  "out",
  "coverage",
  "public",
  "scripts",           // le script lui-même n'a pas besoin d'être scanné
  ".git",
  ".vscode",
  ".idea",
  "messages",          // fichiers de traduction : normal d'y trouver du français
])

const EXCLUDE_FILE_SUFFIX = [
  ".test.tsx",
  ".test.ts",
  ".spec.tsx",
  ".spec.ts",
  ".config.ts",
  ".config.tsx",
]

// -----------------------------------------------------------------------------
// 3. Mots français typiques (heuristique)
// -----------------------------------------------------------------------------
const FRENCH_WORDS = [
  "Ajouter", "Supprimer", "Enregistrer", "Annuler", "Envoyer",
  "Retour", "Nouveau", "Prix", "Panier", "Vider", "Fermer",
  "Continuer", "Valider", "Confirmer", "Chargement", "Erreur",
  "Votre", "Vos", "Tous", "Toutes", "Aucun", "Aucune",
]

const FRENCH_WORD_PATTERN = new RegExp(
  `"[^"]*\\b(${FRENCH_WORDS.join("|")})\\b[^"]*"`,
  "u"
)

// -----------------------------------------------------------------------------
// 4. Faux positifs courants à ignorer
// -----------------------------------------------------------------------------
const SKIP_LINE_PATTERNS = [
  /^\s*\/\//,
  /^\s*\*/,
  /useTranslations/,
  /getTranslations/,
  /useLocale/,
  /aria-label="[^"]*"/,
  /title="[^"]*"/,
  /placeholder="[^"]*"/,
  /^\s*import /,
  /from ".*"/,
  /^\s*\/\*/,
  // ✅ Nouveaux patterns
  /console\.(error|warn|log|debug)/,   // logs de debug
  /isEnglish\s*\?/,                     // ternaires bilingues manuels
  /locale\s*===\s*['"]en['"]/,          // checks de locale
]
// -----------------------------------------------------------------------------
// 5. Parcours récursif du dossier
// -----------------------------------------------------------------------------
function* walkDir(dir) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    let stat
    try {
      stat = statSync(fullPath)
    } catch {
      continue
    }

    if (stat.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry)) continue
      yield* walkDir(fullPath)
    } else if (entry.endsWith(".tsx")) {
      if (EXCLUDE_FILE_SUFFIX.some((suffix) => entry.endsWith(suffix))) continue
      yield fullPath
    }
  }
}

// -----------------------------------------------------------------------------
// 6. Analyse d'un fichier
// -----------------------------------------------------------------------------
function analyzeFile(filePath) {
  const content = readFileSync(filePath, "utf8")
  const lines = content.split(/\r?\n/)
  const suspects = []

  lines.forEach((line, index) => {
    if (SKIP_LINE_PATTERNS.some((pattern) => pattern.test(line))) return

    // Retire les commentaires en fin de ligne avant l'analyse
    const codePart = line.split("//")[0]

    if (FRENCH_WORD_PATTERN.test(codePart)) {
      suspects.push({ line: index + 1, content: line.trim() })
    }
  })

  return suspects
}

// -----------------------------------------------------------------------------
// 7. Point d'entrée
// -----------------------------------------------------------------------------
console.log(`🔍 Recherche de chaînes en dur dans ${relative(PROJECT_ROOT, SCAN_ROOT) || "."}/ ...\n`)

let totalSuspects = 0
let filesAnalyzed = 0

try {
  for (const filePath of walkDir(SCAN_ROOT)) {
    filesAnalyzed++
    const suspects = analyzeFile(filePath)

    if (suspects.length > 0) {
      console.log(`📄 ${relative(PROJECT_ROOT, filePath)}`)
      for (const s of suspects) {
        console.log(`   L${s.line}: ${s.content}`)
        totalSuspects++
      }
      console.log("")
    }
  }
} catch (err) {
  console.error("❌ Erreur lors de l'analyse :", err.message)
  process.exit(1)
}

// -----------------------------------------------------------------------------
// 8. Résumé
// -----------------------------------------------------------------------------
console.log(
  `\n📊 ${filesAnalyzed} fichier(s) analysé(s), ${totalSuspects} ligne(s) suspecte(s)\n`
)

if (totalSuspects === 0) {
  console.log("✅ Aucune chaîne en dur suspecte détectée")
  process.exit(0)
}

console.log("💡 Rappel : les aria-label et les placeholders doivent aussi passer par t()")
console.log("   Les faux positifs (title, aria-label statiques) sont acceptables.\n")
process.exit(0)