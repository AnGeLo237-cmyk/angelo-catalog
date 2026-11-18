// =============================================================================
// PAGE STATISTIQUES (/dashboard/statistiques)
// -----------------------------------------------------------------------------
// Server Component. Toutes les données sont chargées via RPC.
// Période sélectionnable via ?period=7d (défaut) ou ?period=30d.
// =============================================================================

import { connection } from "next/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import {
  getAnalyticsSummary,
  getDailyAnalytics,
  getTopProducts,
} from "@/lib/analytics/aggregate"
import { KpiCard } from "./_components/KpiCard"
import { ViewsChart } from "./_components/ViewsChart"
import { TopProductsList } from "./_components/TopProductsList"

export const instant = false

export default async function StatistiquesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  await connection()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle()
  if (!shop) redirect("/dashboard/onboarding")

  const { period } = await searchParams
  const days = period === "30d" ? 30 : 7
  const periodKey = period === "30d" ? "30d" : "7d"

  const [summary, daily, top] = await Promise.all([
    getAnalyticsSummary(shop.id, days),
    getDailyAnalytics(shop.id, days),
    getTopProducts(shop.id, days, 5),
  ])

  const t = await getTranslations("dashboard.stats")

  const totalEvents = summary.total_views + summary.total_inquiries
  const hasData = totalEvents > 0

  // Taux d'intention : (clics + demandes) / vues * 100
  const intentRate =
    summary.total_views === 0
      ? 0
      : Math.round(
          ((summary.total_whatsapp_clicks + summary.total_inquiries) /
            summary.total_views) *
            100
        )

  const periodLabel = periodKey === "30d" ? t("period30d") : t("period7d")

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t("title")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t("subtitle")}
          </p>
        </div>

        {/* Sélecteur de période (server-rendered via query param) */}
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
          <Link
            href="?period=7d"
            className={`px-3 py-1.5 ${
              periodKey === "7d"
                ? "bg-primary text-white font-medium"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {t("period7d")}
          </Link>
          <Link
            href="?period=30d"
            className={`px-3 py-1.5 border-l border-gray-200 dark:border-gray-700 ${
              periodKey === "30d"
                ? "bg-primary text-white font-medium"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {t("period30d")}
          </Link>
        </div>
      </header>

      {!hasData ? (
        <div className="border border-dashed rounded-lg p-10 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-base font-medium text-gray-900 dark:text-gray-100">
            {t("noData")}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("noDataHint")}
          </p>
        </div>
      ) : (
        <>
          {/* Cartes KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label={t("totalViews")}
              value={summary.total_views.toLocaleString("fr-FR")}
              hint={t("totalViewsHint")}
            />
            <KpiCard
              label={t("totalWhatsAppClicks")}
              value={summary.total_whatsapp_clicks.toLocaleString("fr-FR")}
              hint={t("totalWhatsAppClicksHint")}
              accent="green"
            />
            <KpiCard
              label={t("totalInquiries")}
              value={summary.total_inquiries.toLocaleString("fr-FR")}
              hint={t("totalInquiriesHint")}
              accent="primary"
            />
            <KpiCard
              label={t("intentRate")}
              value={`${intentRate}%`}
              hint={t("intentRateHint")}
              accent="orange"
            />
          </div>

          {/* Graphique vues */}
          <ViewsChart data={daily} label={`${t("viewsChart")} — ${periodLabel}`} />

          {/* Top produits */}
          <div>
            <div className="mb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {t("topProducts")}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t("topProductsHint")}
              </p>
            </div>
            <TopProductsList products={top} unknownLabel={t("unknownProduct")} />
          </div>
        </>
      )}
    </section>
  )
}