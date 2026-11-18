// =============================================================================
// DEMANDES CLIENT — Liste + filtres + actions
// -----------------------------------------------------------------------------

"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import type { InquiryWithProduct } from "@/lib/types/shop"
import { toggleInquiryRead, deleteInquiry } from "./actions"

type Filter = "all" | "unread"

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function DemandesClient({ inquiries }: { inquiries: InquiryWithProduct[] }) {
  const t = useTranslations("dashboard.inquiries")
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>("all")
  const [productFilter, setProductFilter] = useState<string>("all")

  // Liste unique des produits concernés (pour le filtre)
  const distinctProducts = useMemo(() => {
    const map = new Map<string, string>()
    for (const i of inquiries) {
      if (i.product_id && i.product_name) {
        map.set(i.product_id, i.product_name)
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [inquiries])

  const filtered = useMemo(() => {
    return inquiries.filter((i) => {
      if (filter === "unread" && i.is_read) return false
      if (productFilter !== "all" && i.product_id !== productFilter) return false
      return true
    })
  }, [inquiries, filter, productFilter])

  const unreadCount = inquiries.filter((i) => !i.is_read).length

  function runAction(fn: () => Promise<{ success: boolean; error?: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await fn()
      if (result.success) router.refresh()
      else setError(result.error ?? t("error"))
    })
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {t("title")}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {t("subtitle")}
        </p>
        {unreadCount > 0 && (
          <p className="text-xs text-primary font-medium mt-2">
            {t("unreadBadge", { count: unreadCount })}
          </p>
        )}
      </header>

      <div className="flex flex-wrap gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="border rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
        >
          <option value="all">{t("filterAll")}</option>
          <option value="unread">{t("filterUnread")}</option>
        </select>

        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
        >
          <option value="all">{t("allProducts")}</option>
          {distinctProducts.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed rounded p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>{t("empty")}</p>
          <p className="mt-1">{t("emptyHint")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((i) => (
            <li
              key={i.id}
              className={`rounded-lg border p-4 ${
                i.is_read
                  ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {i.sender_name || t("anonymous")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatDate(i.created_at, locale)}
                  </p>
                </div>
                {!i.is_read && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-primary text-white shrink-0">
                    {t("unread")}
                  </span>
                )}
              </div>

              {i.product_name && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {t("aboutProduct", { product: i.product_name })}
                </p>
              )}

              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line mb-3">
                {i.message}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                {i.sender_email && (
                  <a
                    href={`mailto:${i.sender_email}`}
                    className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {t("replyByEmail")}
                  </a>
                )}
                {i.sender_phone && (
                  <a
                    href={`https://wa.me/${i.sender_phone.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {t("replyByWhatsApp")}
                  </a>
                )}
                {!i.sender_email && !i.sender_phone && (
                  <span className="text-xs text-gray-400">{t("noContact")}</span>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => runAction(() => toggleInquiryRead(i.id, !i.is_read))}
                    className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {i.is_read ? t("markAsUnread") : t("markAsRead")}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      if (confirm(t("deleteConfirm"))) {
                        runAction(() => deleteInquiry(i.id))
                      }
                    }}
                    className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    {t("delete")}
                  </button>
                </div>
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