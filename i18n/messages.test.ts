// =============================================================================
// TEST DE COHÉRENCE — Fichiers de messages FR et EN
// -----------------------------------------------------------------------------
// Vérifie que les deux arborescences ont EXACTEMENT les mêmes clés.
// Un test rouge bloque un merge qui aurait oublié de traduire une clé.
//
// Ce test s'exécute à chaque `npm run test:run` et à chaque CI.
// =============================================================================

import { describe, it, expect } from "vitest"
import frMessages from "../messages/fr.json"
import enMessages from "../messages/en.json"

function flattenKeys(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return []
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof value === "object" && value !== null
      ? flattenKeys(value, path)
      : [path]
  })
}

describe("i18n messages", () => {
  it("FR et EN ont exactement les mêmes clés (aucun oubli)", () => {
    const frKeys = flattenKeys(frMessages).sort()
    const enKeys = flattenKeys(enMessages).sort()
    expect(frKeys).toEqual(enKeys)
  })

  it("aucune valeur vide dans FR", () => {
    const empty = flattenKeys(frMessages).filter((key) => {
      const value = key.split(".").reduce<unknown>(
        (acc, part) =>
          typeof acc === "object" && acc !== null
            ? (acc as Record<string, unknown>)[part]
            : undefined,
        frMessages
      )
      return typeof value === "string" && value.trim() === ""
    })
    expect(empty).toEqual([])
  })

  it("aucune valeur vide dans EN", () => {
    const empty = flattenKeys(enMessages).filter((key) => {
      const value = key.split(".").reduce<unknown>(
        (acc, part) =>
          typeof acc === "object" && acc !== null
            ? (acc as Record<string, unknown>)[part]
            : undefined,
        enMessages
      )
      return typeof value === "string" && value.trim() === ""
    })
    expect(empty).toEqual([])
  })
})