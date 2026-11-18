// =============================================================================
// LAYOUT DASHBOARD (/dashboard/*)
// -----------------------------------------------------------------------------
// 1. Force le rendu dynamique (lit cookies de session)
// 2. Charge l'utilisateur (redirige /login si absent)
// 3. Charge la boutique (null si pas encore créée)
// 4. Charge le compteur de demandes non lues (pour le badge sidebar)
// 5. Deux cas :
//    a. Boutique absente → layout minimal (onboarding)
//    b. Boutique présente → layout complet (Sidebar + Header)
//
// ⚠️ `instant = false` couvre tout le sous-arbre /dashboard/* :
//    plus besoin de le répéter sur chaque page.
// =============================================================================

import { connection } from "next/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/dashboard/Sidebar"

export const instant = false

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Charge la boutique + compteur de non-lues en parallèle.
  // On utilise `maybeSingle()` pour la boutique (null si absente).
  // Le count utilise `head: true` pour ne rapatrier que le nombre.
  const [{ data: shop }, unreadResult] = await Promise.all([
    supabase
      .from("shops")
      .select("id, name, slug, logo_url, primary_color, theme_mode")
      .eq("owner_id", user.id)
      .maybeSingle(),
    // Le compteur ne peut être calculé qu'avec un shop.id.
    // On utilise une astuce : on attend la boutique en premier, puis
    // on lance la 2ᵉ requête. Pour éviter un waterfall, on peut tout
    // faire en séquence — le coût est négligeable (une seule requête rapide).
    Promise.resolve(null),
  ])

  // Cas (a) : pas encore de boutique → layout minimal
  if (!shop) {
    return <>{children}</>
  }

  // Cas (b) : boutique présente → charge le compteur de demandes non lues
  const { count: unreadInquiries } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shop.id)
    .eq("is_read", false)

  return (
    <div className="min-h-screen flex bg-surface-muted text-on-surface">
      <Sidebar
        shopName={shop.name}
        shopSlug={shop.slug}
        shopLogoUrl={shop.logo_url}
        unreadInquiries={unreadInquiries ?? 0}
      />

      <div className="flex-1 min-w-0 md:ml-0">
        <header className="hidden md:block bg-surface border-b border-border px-6 py-3">
          <p className="text-sm text-on-surface-muted truncate">
            Espace commerçant — {shop.name}
          </p>
        </header>

        <main id="main-content" tabIndex={-1} className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}