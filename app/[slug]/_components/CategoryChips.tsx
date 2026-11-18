// =============================================================================
// CHIPS DE CATÉGORIES — Scroll horizontal sur mobile
// =============================================================================

"use client"

import { useTranslations } from "next-intl"

export function CategoryChips({
  categories,
  selected,
  onSelect,
}: {
  categories: Array<{ id: string; name: string; product_count: number }>
  selected: string | null
  onSelect: (id: string | null) => void
}) {
  const t = useTranslations("vitrine.filters")

  const totalCount = categories.reduce((sum, c) => sum + c.product_count, 0)

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
          selected === null
            ? "bg-primary text-white shadow-sm"
            : "bg-surface-muted text-on-surface hover:bg-border"
        }`}
      >
        {t("all")}
        <span
          className={`text-[10px] tabular-nums ${
            selected === null ? "text-white/70" : "text-on-surface-muted"
          }`}
        >
          {totalCount}
        </span>
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c.id)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
            selected === c.id
              ? "bg-primary text-white shadow-sm"
              : "bg-surface-muted text-on-surface hover:bg-border"
          }`}
        >
          {c.name}
          <span
            className={`text-[10px] tabular-nums ${
              selected === c.id ? "text-white/70" : "text-on-surface-muted"
            }`}
          >
            {c.product_count}
          </span>
        </button>
      ))}
    </div>
  )
}