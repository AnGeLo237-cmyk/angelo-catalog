// =============================================================================
// GRAPHIQUE VUES — Barres CSS, une barre par jour
// -----------------------------------------------------------------------------
// Pas de dépendance : juste des divs dont la hauteur est proportionnelle.
// Tooltip natif au survol (attribut title).
// =============================================================================

import type { DailyAnalytics } from "@/lib/types/analytics"

export function ViewsChart({
  data,
  label,
}: {
  data: DailyAnalytics[]
  label: string
}) {
  if (data.length === 0) return null

  const maxViews = Math.max(1, ...data.map((d) => d.views))
  const total = data.reduce((sum, d) => sum + d.views, 0)

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {label}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
          {total.toLocaleString("fr-FR")} total
        </p>
      </div>

      <div className="flex items-end gap-0.5 sm:gap-1 h-40 sm:h-48">
        {data.map((d) => {
          const heightPct = d.views === 0 ? 2 : (d.views / maxViews) * 100
          const date = new Date(d.day).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
          })
          return (
            <div
              key={d.day}
              className="flex-1 flex flex-col justify-end group relative"
              title={`${date} : ${d.views} vues, ${d.whatsapp_clicks} clics`}
            >
              <div
                className="w-full bg-primary rounded-t hover:bg-primary/80 transition-colors min-h-[2px]"
                style={{ height: `${heightPct}%` }}
              />
            </div>
          )
        })}
      </div>

      {/* Légende minimaliste : première et dernière date */}
      <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-500 mt-2 tabular-nums">
        <span>
          {new Date(data[0].day).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
          })}
        </span>
        <span>
          {new Date(data[data.length - 1].day).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
          })}
        </span>
      </div>
    </div>
  )
}