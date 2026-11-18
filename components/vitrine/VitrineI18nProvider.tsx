// =============================================================================
// I18N VITRINE — Provider local
// -----------------------------------------------------------------------------
// Enveloppe les Client Components de la vitrine avec les messages de
// la boutique visitée (pas ceux du visiteur connecté).
// =============================================================================

"use client"

import { NextIntlClientProvider } from "next-intl"
import type { ReactNode } from "react"

export function VitrineI18nProvider({
  locale,
  messages,
  children,
}: {
  locale: string
  messages: Record<string, unknown>
  children: ReactNode
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}