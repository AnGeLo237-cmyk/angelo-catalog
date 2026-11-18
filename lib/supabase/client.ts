// =============================================================================
// CLIENT SUPABASE — NAVIGATEUR
// -----------------------------------------------------------------------------
// Ce fichier crée une instance Supabase utilisable dans les Client Components
// (fichiers marqués "use client").
//
// Il utilise `createBrowserClient` de @supabase/ssr qui stocke la session dans
// des COOKIES (et non dans localStorage). Pourquoi ? Parce que les cookies
// sont accessibles à la fois par le navigateur ET par le serveur Next.js.
// Sans cela, le serveur ne pourrait pas savoir qui est connecté.
//
// Usage type :
//   "use client"
//   import { createClient } from '@/lib/supabase/client'
//   const supabase = createClient()
//   await supabase.auth.signInWithPassword({ email, password })
// =============================================================================

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    // L'URL du projet Supabase (variable publique, exposée au navigateur)
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // La clé "anon" / "publishable" — publique par nature, sécurisée par RLS
    // ⚠️ Ne JAMAIS utiliser la clé service_role ici : elle contourne RLS
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}