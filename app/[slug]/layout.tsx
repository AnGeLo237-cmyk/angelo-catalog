// =============================================================================
// LAYOUT VITRINE (/[slug]/*)
// -----------------------------------------------------------------------------
// Charge la boutique, injecte le thème et le provider i18n local.
// Retourne notFound() si la boutique n'existe pas ou est inactive.
//
// ⚠️ La vitrine étant publique, le prérendu statique est possible quand
//    Next.js le souhaite. On autorise le blocage (instan = false) pour
//    simplifier, car on lit la DB à chaque requête (RLS filtre).
// =============================================================================

import { notFound } from "next/navigation"
import { getShopBySlug } from "@/lib/vitrine/get-shop-by-slug"
import { loadMessages } from "@/lib/vitrine/load-messages"
import { VitrineThemeProvider } from "@/components/vitrine/VitrineThemeProvider"
import { VitrineI18nProvider } from "@/components/vitrine/VitrineI18nProvider"
import { CartProvider } from "@/components/vitrine/cart/CartProvider"
import { CartShell } from "@/components/vitrine/cart/CartShell"

export const instant = false

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  const messages = loadMessages(shop.language)

  return (
    <VitrineThemeProvider themeMode={shop.theme_mode} primaryColor={shop.primary_color}>
      <VitrineI18nProvider locale={shop.language} messages={messages}>
        <CartProvider shopId={shop.id} shopSlug={shop.slug}>
          <div className="min-h-screen bg-surface text-on-surface">
            {children}
            <CartShell
              shopName={shop.name}
              shopSlug={shop.slug}
              whatsappNumber={shop.whatsapp_number}
            />
          </div>
        </CartProvider>
      </VitrineI18nProvider>
    </VitrineThemeProvider>
  )
}