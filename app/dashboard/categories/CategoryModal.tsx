// =============================================================================
// MODALE DE CRÉATION / ÉDITION D'UNE CATÉGORIE
// -----------------------------------------------------------------------------
// Utilise useActionState pour capturer les erreurs serveur.
// Se ferme et rafraîchit la page en cas de succès (via onSuccess).
// =============================================================================

"use client"

import { useActionState, useEffect } from "react"
import { useTranslations } from "next-intl"
import type { Category } from "@/lib/types/shop"
import { createCategory, updateCategory } from "./actions"

type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string }

export function CategoryModal({
  mode,
  category,
  onClose,
  onSuccess,
}: {
  mode: "create" | "edit"
  category?: Category
  onClose: () => void
  onSuccess: () => void
}) {
  const t = useTranslations("dashboard.categories")

  async function action(
    _prev: ActionResult | null,
    formData: FormData
  ): Promise<ActionResult> {
    return mode === "create"
      ? createCategory(formData)
      : updateCategory(category!.id, formData)
  }

  const [state, formAction, isPending] = useActionState(action, null)

  // Fermeture automatique en cas de succès
  useEffect(() => {
    if (state?.success) onSuccess()
  }, [state, onSuccess])

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {mode === "create" ? t("add") : t("edit")}
        </h2>

        <form action={formAction} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              {t("nameLabel")}
            </span>
            <input
              type="text"
              name="name"
              required
              maxLength={60}
              defaultValue={category?.name ?? ""}
              placeholder={t("namePlaceholder")}
              disabled={isPending}
              className="w-full border rounded px-3 py-2
                         bg-white dark:bg-gray-900
                         text-gray-900 dark:text-gray-100
                         border-gray-300 dark:border-gray-600"
            />
          </label>

          {state && !state.success && (
            <p role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-3 py-2 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-3 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "…" : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}