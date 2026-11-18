// =============================================================================
// BARRE DE RECHERCHE
// =============================================================================

"use client"

import { useTranslations } from "next-intl"

export function SearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const t = useTranslations("vitrine.search")

  return (
    <div className="relative">
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-muted"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("placeholder")}
        aria-label={t("placeholder")}
        className="w-full pl-11 pr-10 py-3 rounded-xl border border-border bg-surface-muted text-on-surface placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("clear")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-muted hover:text-on-surface"
        >
          ✕
        </button>
      )}
    </div>
  )
}