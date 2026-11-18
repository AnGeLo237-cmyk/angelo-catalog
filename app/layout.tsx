// src/app/layout.tsx
import type { Metadata, Viewport } from "next"
import { connection } from "next/server"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import "./globals.css"

export const instant = false

export const metadata: Metadata = {
  title: {
    default: "Catalogue en ligne",
    template: "%s | Catalogue",
  },
  description:
    "Créez et partagez le catalogue de votre boutique en quelques minutes.",
  applicationName: "Catalogue",
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3ecf8e",
  colorScheme: "light dark",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await connection()
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        {/* Skip link — premier élément focusable, invisible sauf au focus clavier */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-gray-900 focus:text-white focus:text-sm focus:font-medium focus:shadow-lg"
        >
          {locale === "en" ? "Skip to content" : "Aller au contenu"}
        </a>

        <NextIntlClientProvider key={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}