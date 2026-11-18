// src/proxy.ts
// =============================================================================
// PROXY NEXT.JS 16 (anciennement middleware)
// -----------------------------------------------------------------------------
// Next.js 16 exige que la fonction exportée s'appelle `proxy` (ou soit un
// export par défaut). L'ancien nom `middleware` n'est plus reconnu.
//
// Le matcher exclut les Server Actions (header `next-action`) pour éviter
// que le proxy ne casse le protocole RSC.
// =============================================================================

import type { NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "next-action" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
}