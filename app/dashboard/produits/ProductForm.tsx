// =============================================================================
// FORMULAIRE PRODUIT — partagé création / édition
// -----------------------------------------------------------------------------
// Utilise useActionState. Les champs sont pré-remplis en édition.
// Le prix vide = "prix sur demande". La devise est un select.
// =============================================================================

"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import type { Category, Currency, Product, ProductStatus } from "@/lib/types/shop"

type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string }

const label = "block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
const field =
  "w-full border rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"

export function ProductForm({
  mode,
  product,
  categories,
  action,
  redirectOnSuccess = "/dashboard/produits",   // ← nouvelle prop
}: {
  mode: "create" | "edit"
  product?: Product
  categories: Category[]
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>
  redirectOnSuccess?: string
}) {
  const t = useTranslations("dashboard.products")
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(action, null)

  // Après succès : rafraîchit la liste et quitte le formulaire
  useEffect(() => {
    if (state?.success) {
      // En mode create, on passe l'id retourné pour aller direct sur l'édition
      const target = mode === "create" && state.id
        ? `/dashboard/produits/${state.id}/editer`
        : redirectOnSuccess
      router.push(target)
      router.refresh()
    }
  }, [state, router, mode, redirectOnSuccess])

  return (
    <form 
        action={formAction}
        onSubmit={(e) => {
            // Empêche la double soumission si la première n'est pas terminée
            if (isPending) e.preventDefault()
        }}        
        className="space-y-4 max-w-2xl"
    >
      <label className="block">
        <span className={label}>{t("nameLabel")} *</span>
        <input
          type="text"
          name="name"
          required
          maxLength={120}
          defaultValue={product?.name ?? ""}
          placeholder={t("namePlaceholder")}
          disabled={isPending}
          className={field}
        />
      </label>

      <label className="block">
        <span className={label}>{t("descriptionLabel")}</span>
        <textarea
          name="description"
          rows={4}
          maxLength={2000}
          defaultValue={product?.description ?? ""}
          placeholder={t("descriptionPlaceholder")}
          disabled={isPending}
          className={field}
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className={label}>{t("priceLabel")}</span>
          <input
            type="number"
            name="price"
            min={0}
            step="0.01"
            defaultValue={product?.price ?? ""}
            disabled={isPending}
            className={field}
          />
          <span className="text-xs text-gray-500 mt-1 block">{t("priceHint")}</span>
        </label>

        <label className="block">
          <span className={label}>{t("currencyLabel")}</span>
          <select
            name="currency"
            defaultValue={product?.currency ?? "XOF"}
            disabled={isPending}
            className={field}
          >
            <option value="XOF">XOF (F CFA)</option>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className={label}>{t("stockLabel")}</span>
          <input
            type="number"
            name="stock"
            min={0}
            step={1}
            defaultValue={product?.stock ?? ""}
            disabled={isPending}
            className={field}
          />
          <span className="text-xs text-gray-500 mt-1 block">{t("stockHint")}</span>
        </label>

        <label className="block">
          <span className={label}>{t("categoryLabel")}</span>
          <select
            name="category_id"
            defaultValue={product?.category_id ?? ""}
            disabled={isPending}
            className={field}
          >
            <option value="">{t("noCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className={label}>{t("statusLabel")}</span>
        <select
          name="status"
          defaultValue={product?.status ?? "draft"}
          disabled={isPending}
          className={field}
        >
          <option value="draft">{t("statusDraft")}</option>
          <option value="published">{t("statusPublished")}</option>
          <option value="archived">{t("statusArchived")}</option>
        </select>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_featured"
          defaultChecked={product?.is_featured ?? false}
          disabled={isPending}
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {t("featuredLabel")}
        </span>
      </label>

      {state && !state.success && (
        <p role="alert" data-testid="product-form-error" className="text-sm text-red-600">{state.error}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard/produits")}
          disabled={isPending}
          className="px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "…" : t("save")}
        </button>
      </div>
    </form>
  )
}