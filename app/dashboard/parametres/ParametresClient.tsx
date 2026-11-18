"use client"

// =============================================================================
// PARAMÈTRES — Client Component
// -----------------------------------------------------------------------------
// ✅ Correctif appliqué : après chaque action réussie, on appelle
//    router.refresh() pour recharger les données serveur ET les messages
//    next-intl. Sans cela, NextIntlClientProvider conserve les anciens
//    messages jusqu'à un rechargement manuel.
//
// 🎨 Le ThemeProvider recevant shop.theme_mode / shop.primary_color sera
//    également re-rendu grâce à la `key` posée sur ce composant côté page.
// =============================================================================

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import type {
  ShopSettings,
  ThemeMode,
  ShopLanguage,
  CatalogLayout,
} from "@/lib/types/shop"
import {
  updateThemeMode,
  updatePrimaryColor,
  updateLanguage,
  updateCatalogLayout,
} from "./actions"

export function ParametresClient({ shop }: { shop: ShopSettings }) {
  const t = useTranslations("dashboard.settings")
  const router = useRouter() // ← nécessaire pour router.refresh()
  const [color, setColor] = useState<string>(shop.primary_color)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // ---------------------------------------------------------------------------
  // Wrapper d'exécution d'action
  // ---------------------------------------------------------------------------
  // 1. Exécute l'action dans une transition (isPending = true)
  // 2. Si succès → router.refresh() pour recharger les données serveur
  //               et les messages next-intl
  // 3. Si échec → affiche l'erreur retournée par l'action
  // ---------------------------------------------------------------------------
  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.success) {
        router.refresh() // ← fonctionne maintenant car le cookie est à jour
      } else {
        setError(result.error ?? t("error"))
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Mode clair/sombre */}
      <section>
        <label className="block text-sm font-medium mb-2">
          {t("themeMode")}
        </label>
        <select
          defaultValue={shop.theme_mode}
          onChange={(e) => run(() => updateThemeMode(e.target.value as ThemeMode))}
          disabled={isPending}
          className="border rounded px-3 py-2
                    bg-white dark:bg-gray-800
                    text-gray-900 dark:text-gray-100
                    border-gray-300 dark:border-gray-600"
        >
          <option value="light">{t("light")}</option>
          <option value="dark">{t("dark")}</option>
          <option value="system">{t("system")}</option>
        </select>
      </section>

      {/* Couleur principale */}
      <section>
        <label className="block text-sm font-medium mb-2">
          {t("primaryColor")}
        </label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          onBlur={() => run(() => updatePrimaryColor(color))}
          disabled={isPending}
          className="w-16 h-10 border rounded"
        />
      </section>

      {/* Langue */}
      <section>
        <label className="block text-sm font-medium mb-2">
          {t("language")}
        </label>
        <select
          defaultValue={shop.language}
          onChange={(e) =>
            run(() => updateLanguage(e.target.value as ShopLanguage))
          }
          disabled={isPending}
          className="border rounded px-3 py-2
                   bg-white dark:bg-gray-800
                   text-gray-900 dark:text-gray-100
                   border-gray-300 dark:border-gray-600"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">{t("languageNote")}</p>
      </section>

      {/* Disposition du catalogue */}
      <section>
        <label className="block text-sm font-medium mb-2">
          {t("catalogLayout")}
        </label>
        <select
          defaultValue={shop.catalog_layout}
          onChange={(e) =>
            run(() => updateCatalogLayout(e.target.value as CatalogLayout))
          }
          disabled={isPending}
          className="border rounded px-3 py-2
                   bg-white dark:bg-gray-800
                   text-gray-900 dark:text-gray-100
                   border-gray-300 dark:border-gray-600"
        >
          <option value="grid-2">{t("grid2")}</option>
          <option value="grid-3">{t("grid3")}</option>
          <option value="grid-4">{t("grid4")}</option>
          <option value="list">{t("list")}</option>
        </select>
      </section>

      {isPending && <p className="text-xs text-gray-500">{t("saving")}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}