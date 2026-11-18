// =============================================================================
// HERO BOUTIQUE — Présentation avec logo, nom, description, contact
// =============================================================================

"use client"

import { useTranslations } from "next-intl"
import type { PublicShop } from "@/lib/vitrine/get-shop-by-slug"
import { WhatsAppButton } from "./WhatsAppButton"

export function ShopHero({
  shop,
  productCount,
  categoryCount,
  lastUpdate,
  tagline,
  coverImageUrl,
}: {
  shop: PublicShop
  productCount: number
  categoryCount: number
  lastUpdate: { relative: string } | null
  tagline: string | null
  coverImageUrl: string | null
}) {
  const t = useTranslations("vitrine.hero")
  const year = new Date(shop.created_at).getFullYear()

  return (
    <header className="relative overflow-hidden border-b border-border">
      {/* --- Arrière-plan : cover ou motif animé ------------------------- */}
      {coverImageUrl ? (
        <>
          {/* Image de couverture avec flou léger et overlay */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover scale-105 blur-sm"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--surface) 40%, transparent) 0%, color-mix(in srgb, var(--surface) 85%, transparent) 60%, var(--surface) 100%)",
            }}
            aria-hidden="true"
          />
        </>
      ) : (
        <div className="absolute inset-0 hero-gradient" aria-hidden="true" />
      )}

      {/* Motif pointillé subtil (par-dessus, très léger) */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--on-surface) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      {/* --- Contenu ---------------------------------------------------- */}
      <div className="relative max-w-5xl mx-auto px-4 py-12 sm:py-20">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Logo ou initiale */}
          {shop.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.logo_url}
              alt={`${shop.name} logo`}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-xl ring-4 ring-surface flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-primary text-white flex items-center justify-center text-4xl font-bold shadow-xl ring-4 ring-surface flex-shrink-0">
              {shop.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 text-center sm:text-left">
            {/* Nom */}
            <h1 className="text-3xl sm:text-5xl font-bold text-on-surface tracking-tight leading-tight">
              {shop.name}
            </h1>

            {/* Tagline (1ʳᵉ phrase de description, en gros) */}
            {tagline && (
              <p className="mt-2 text-base sm:text-lg font-medium text-on-surface/80 max-w-2xl leading-snug">
                {tagline}
              </p>
            )}

            {/* Description restante (si plus longue que la tagline) */}
            {shop.description && shop.description !== tagline && (
              <p className="mt-2 text-sm sm:text-base text-on-surface-muted max-w-2xl leading-relaxed line-clamp-2">
                {shop.description.length > (tagline?.length ?? 0) + 20
                  ? shop.description
                  : null}
              </p>
            )}

            {/* Compteurs : depuis, produits, catégories, mise à jour */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1 mt-4 text-xs sm:text-sm text-on-surface-muted">
              <span>{t("since", { year })}</span>
              <span aria-hidden="true">·</span>
              <span>{t("products", { count: productCount })}</span>
              {categoryCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{t("categories", { count: categoryCount })}</span>
                </>
              )}
              {lastUpdate && (
                <>
                  <span aria-hidden="true">·</span>
                  <span
                    className="inline-flex items-center gap-1.5"
                    title={lastUpdate.relative}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-slow"
                      aria-hidden="true"
                    />
                    {t("lastUpdate", { when: lastUpdate.relative })}
                  </span>
                </>
              )}
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <WhatsAppButton phoneNumber={shop.whatsapp_number} />
              {shop.contact_email && (
                <a
                  href={`mailto:${shop.contact_email}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border-2 border-on-surface/20 text-on-surface text-sm font-medium hover:border-on-surface/40 hover:bg-on-surface/5 transition"
                >
                  ✉ {t("contact")}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}