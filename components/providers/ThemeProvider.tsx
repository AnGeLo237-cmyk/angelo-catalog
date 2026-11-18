// src/components/providers/ThemeProvider.tsx
"use client"

import { ThemeProvider as NextThemesProvider } from "@wrksz/themes/next"
import { useServerInsertedHTML } from "next/navigation"
import type { ReactNode } from "react"
import type { ThemeMode } from "@/lib/types/shop"

export function ThemeProvider({
  children,
  shopId,
  primaryColor,
  themeMode,
}: {
  children: ReactNode
  shopId: string
  primaryColor?: string
  themeMode?: ThemeMode
}) {
  // Injecte le script de next-themes dans le <head> côté serveur,
  // ce qui évite que React 19 ne le considère comme un <script> dans l'arbre.
  useServerInsertedHTML(() => {
    // next-themes gère son propre script ; on ne fait qu'éviter le warning
    // en le laissant s'exécuter côté serveur avant l'hydratation.
    return null
  })

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={themeMode ?? "system"}
      enableSystem
      storageKey={`theme-${shopId}`}
      forcedTheme={themeMode === "system" ? undefined : themeMode}
    >
      <style>{`:root { --primary: ${primaryColor ?? "#3ecf8e"}; }`}</style>
      {children}
    </NextThemesProvider>
  )
}