// =============================================================================
// PRODUITS CLIENT — Liste + filtres + actions rapides
// -----------------------------------------------------------------------------
// Filtrage client-side (statut + catégorie) par useMemo. Adapté pour
// des catalogues < 100 produits. Pagination serveur si besoin en Phase 2.
// =============================================================================

"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import type { Category, ProductWithCategory, ProductStatus } from "@/lib/types/shop"
import { deleteProduct, togglePublish, toggleFeatured } from "./actions"

function formatPrice(price: number | null, currency: string, locale: string): string {
  if (price === null) return ""
  try {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price)
  } catch {
    return `${price} ${currency}`
  }
}

export function ProduitsClient({
  products,
  categories,
}: {
  products: ProductWithCategory[]
  categories: Category[]
}) {
  const t = useTranslations("dashboard.products")
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all")
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all")

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false
      if (categoryFilter !== "all") {
        if (categoryFilter === "none" && p.category_id !== null) return false
        if (categoryFilter !== "none" && p.category_id !== categoryFilter) return false
      }
      return true
    })
  }, [products, statusFilter, categoryFilter])

  function runAction(fn: () => Promise<{ success: boolean; error?: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await fn()
      if (result.success) router.refresh()
      else setError(result.error ?? t("errors.generic"))
    })
  }

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t("subtitle")}</p>
        </div>
        <Link
          href="/dashboard/produits/nouveau"
          className="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90"
        >
          + {t("add")}
        </Link>
      </header>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProductStatus | "all")}
          className="border rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
        >
          <option value="all">{t("filterAllStatuses")}</option>
          <option value="draft">{t("statusDraft")}</option>
          <option value="published">{t("statusPublished")}</option>
          <option value="archived">{t("statusArchived")}</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
        >
          <option value="all">{t("filterAllCategories")}</option>
          <option value="none">{t("noCategory")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <span className="text-xs text-gray-500 self-center ml-auto">
          {t("productCount", { count: filtered.length })}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed rounded p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>{t("empty")}</p>
          <p className="mt-1">{t("emptyHint")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2"
            >
              {/* Miniature : image principale ou placeholder */}
              {p.main_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.main_image_url}
                  alt=""
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] text-gray-400 flex-shrink-0">
                  IMG
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {p.name}
                  </p>
                  {p.is_featured && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                      ★
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      p.status === "published"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : p.status === "draft"
                        ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                        : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                    }`}
                  >
                    {p.status === "published"
                      ? t("statusPublished")
                      : p.status === "draft"
                      ? t("statusDraft")
                      : t("statusArchived")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {p.price === null ? (
                    <em>{t("priceOnRequest")}</em>
                  ) : (
                    formatPrice(p.price, p.currency, locale)
                  )}
                  {p.category_name && <> · {p.category_name}</>}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  href={`/dashboard/produits/${p.id}/editer`}
                  className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t("edit")}
                </Link>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => runAction(() => togglePublish(p.id))}
                  className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {p.status === "published" ? t("unpublish") : t("publish")}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => runAction(() => toggleFeatured(p.id))}
                  className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  aria-label={t("featuredLabel")}
                >
                  {p.is_featured ? "★" : "☆"}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    if (confirm(t("deleteConfirm"))) {
                      runAction(() => deleteProduct(p.id))
                    }
                  }}
                  className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  {t("delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}
    </section>
  )
}