// =============================================================================
// CLIENT SUPABASE — SERVEUR
// -----------------------------------------------------------------------------
// Ce fichier crée une instance Supabase utilisable dans :
//   - les Server Components (fichiers sans "use client")
//   - les Server Actions ("use server")
//   - les Route Handlers (app/api/.../route.ts)
//
// Il lit la session depuis les COOKIES de la requête entrante. C'est ce qui
// permet à RLS de savoir "qui parle" côté serveur, même lors du rendu d'une
// page publique ou de l'exécution d'une action protégée.
//
// Usage type (Server Component) :
//   import { createClient } from '@/lib/supabase/server'
//   const supabase = await createClient()
//   const { data: { user } } = await supabase.auth.getUser()
//
// ⚠️ La fonction est ASYNC : `cookies()` de Next.js 15+ est asynchrone.
//    Toujours faire `await createClient()`.
// =============================================================================

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // Récupère le "cookie store" de la requête en cours.
  // En Next.js 15, cette fonction est asynchrone.
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // --- Lecture des cookies ---
        // `getAll` retourne tous les cookies de la requête.
        // On utilise cette méthode (et non `get`) car les anciennes méthodes
        // sont dépréciées et cassent @supabase/ssr récent.
        getAll() {
          return cookieStore.getAll()
        },

        // --- Écriture des cookies ---
        // Appelée quand Supabase doit rafraîchir le jeton d'accès,
        // par exemple après un signIn ou un refresh automatique.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ce bloc catch est VOLONTAIRE et important.
            //
            // Contexte : dans un Server Component (pendant le rendu d'une page),
            // les cookies sont en LECTURE SEULE. Tenter de les écrire lève une
            // exception, ce qui ferait planter la page.
            //
            // Pourquoi ignorer ? Parce que c'est le MIDDLEWARE qui a la
            // responsabilité de rafraîchir les cookies avant que la requête
            // n'atteigne le Server Component. Quand on arrive ici, la session
            // est déjà à jour. Le catch évite juste un crash inutile.
            //
            // ⚠️ Ne pas retirer ce try/catch sans avoir vérifié que le
            //    middleware tourne bien sur toutes les routes concernées.
          }
        },
      },
    }
  )
}