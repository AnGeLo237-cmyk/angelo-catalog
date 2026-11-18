// =============================================================================
// GLOBAL ERROR (/app/global-error.tsx)
// -----------------------------------------------------------------------------
// Intercepte les erreurs du RootLayout lui-même (cas très rare : le layout
// plante avant même de pouvoir rendre error.tsx).
//
// ⚠️ DOIT inclure <html> et <body> car il remplace le RootLayout entier.
//    Styles inline uniquement (Tailwind n'est pas encore chargé à ce stade).
// =============================================================================

"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[global error]", { digest: error.digest })
  }, [error])

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#f9fafb",
          color: "#111827",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "28rem" }}>
          <p style={{ fontSize: "3rem", margin: "0 0 1rem" }}>⚠️</p>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              margin: "0 0 0.5rem",
            }}
          >
            Une erreur critique est survenue
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              margin: "0 0 1.5rem",
            }}
          >
            A critical error occurred. Please reload the page.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: "0.625rem",
                color: "#9ca3af",
                fontFamily: "monospace",
                margin: "0 0 1rem",
              }}
            >
              Ref: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              background: "#111827",
              color: "#ffffff",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Recharger / Reload
          </button>
        </div>
      </body>
    </html>
  )
}