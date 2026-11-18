// =============================================================================
// HELPER MIDDLEWARE — MISE À JOUR DE SESSION + PROTECTION DES ROUTES
// -----------------------------------------------------------------------------
// Ce fichier contient la logique métier du middleware. Il est séparé du
// fichier racine `src/middleware.ts` pour deux raisons :
//   1. Garder `src/middleware.ts` minimal (Next.js l'exige à la racine de src/).
//   2. Faciliter les tests unitaires du helper indépendamment de Next.js.
//
// Rôle du middleware (rappel) :
//   - Rafraîchir la session si le jeton a expiré
//   - Propager les cookies à jour vers la réponse
//   - Rediriger les utilisateurs non autorisés
// =============================================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // On prépare une réponse "par défaut" qui laisse passer la requête.
  // Elle sera remplacée si on doit rediriger, ou complétée avec les
  // cookies rafraîchis si la session a été mise à jour.
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Lecture : on lit les cookies depuis la requête entrante.
        getAll() {
          return request.cookies.getAll()
        },

        // Écriture : on doit mettre à jour À LA FOIS la requête et la réponse.
        //   - request.cookies.set : pour que le reste du pipeline (Server
        //     Components) voie les nouveaux cookies pendant cette requête.
        //   - supabaseResponse.cookies.set : pour que le navigateur reçoive
        //     les nouveaux cookies dans la réponse HTTP.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ⚠️ TRÈS IMPORTANT : ne rien faire entre la création du client et
  // l'appel à getUser(). Sinon, des bugs de déconnexion aléatoire peuvent
  // survenir (problème connu de @supabase/ssr).
  //
  // getUser() valide le jeton auprès du serveur Supabase (sécurisé).
  // getSession() lit juste un cookie non vérifié → ne PAS l'utiliser ici.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ---------------------------------------------------------------------------
  // PROTECTION DES ROUTES
  // ---------------------------------------------------------------------------
  const pathname = request.nextUrl.pathname

  // Règle 1 : accès au dashboard sans être connecté → redirection /login
  if (pathname.startsWith('/dashboard') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // On peut ajouter un paramètre `redirectTo` pour revenir après login.
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Règle 2 : utilisateur déjà connecté qui va sur /login ou /register
  //           → redirection /dashboard (évite un login inutile)
  if ((pathname === '/login' || pathname === '/register') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Aucune règle déclenchée : on laisse passer la requête avec la réponse
  // (potentiellement enrichie de cookies rafraîchis).
  return supabaseResponse
}