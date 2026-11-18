// =============================================================================
// TOP PRODUITS — Liste avec vues + clics
// =============================================================================

import Link from "next/link"
import type { TopProduct } from "@/lib/types/analytics"

export function TopProductsList({
  products,
  unknownLabel,
}: {
  products: TopProduct[]
  unknownLabel: string
}) {
  if (products.length === 0) return null

  const maxViews = Math.max(1, ...products.map((p) => Number(p.views)))

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      {products.map((p, idx) => {
        const pct = (Number(p.views) / maxViews) * 100
        return (
          <div
            key={p.product_id}
            className={`py-2 ${idx > 0 ? "border-t border-gray-100 dark:border-gray-700" : ""}`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold text-gray-400 tabular-nums w-5 text-right flex-shrink-0">
                  {idx + 1}.
                </span>
                <Link
                  href={`/dashboard/produits/${p.product_id}/editer`}
                  className="text-sm text-gray-900 dark:text-gray-100 truncate hover:underline"
                >
                  {p.product_name || unknownLabel}
                </Link>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 tabular-nums flex-shrink-0">
                <span>👁 {Number(p.views).toLocaleString("fr-FR")}</span>
                <span>💬 {Number(p.whatsapp_clicks).toLocaleString("fr-FR")}</span>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden ml-7">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}