// =============================================================================
// KPI CARD — Carte de métrique (valeur + libellé + hint)
// =============================================================================

export function KpiCard({
  label,
  value,
  hint,
  accent = "default",
}: {
  label: string
  value: string | number
  hint?: string
  accent?: "default" | "primary" | "green" | "orange"
}) {
  const accentClass = {
    default: "text-on-surface",
    primary: "text-primary",
    green: "text-green-600 dark:text-green-400",
    orange: "text-orange-600 dark:text-orange-400",
  }[accent]

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className={`text-3xl font-bold mt-2 tabular-nums ${accentClass}`}>
        {value}
      </p>
      {hint && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{hint}</p>
      )}
    </div>
  )
}