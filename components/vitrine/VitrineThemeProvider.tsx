// =============================================================================
// THÈME VITRINE — Isolé du dashboard
// -----------------------------------------------------------------------------
// Sur la vitrine publique, on force le thème choisi par le commerçant
// (pas de personnalisation par visiteur). On n'utilise pas next-themes
// pour éviter localStorage et le script inline associé.
// =============================================================================

"use client"

import { useEffect, type ReactNode } from "react"
import type { ThemeMode } from "@/lib/types/shop"

export function VitrineThemeProvider({
  children,
  themeMode,
  primaryColor,
}: {
  children: ReactNode
  themeMode: ThemeMode
  primaryColor: string
}) {
  useEffect(() => {
    const root = document.documentElement

    // Injecte la couleur principale
    root.style.setProperty("--primary", primaryColor)

    // Applique la classe dark selon le mode
    const apply = (isDark: boolean) => {
      root.classList.toggle("dark", isDark)
    }

    if (themeMode === "dark") {
      apply(true)
    } else if (themeMode === "light") {
      apply(false)
    } else {
      // "system" : suit l'OS, avec écoute des changements
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      apply(mq.matches)
      const handler = (e: MediaQueryListEvent) => apply(e.matches)
      mq.addEventListener("change", handler)
      return () => mq.removeEventListener("change", handler)
    }
  }, [themeMode, primaryColor])

  return <>{children}</>
}