// vitest.config.mts
// =============================================================================
// CONFIGURATION VITEST POUR NEXT.JS
// -----------------------------------------------------------------------------
// - `tsconfigPaths()` permet de résoudre les alias comme `@/lib/...`
// - `react()` active le support JSX/TSX pour les tests de composants
// - `environment: "jsdom"` simule un DOM pour tester des composants React
// =============================================================================

import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },  
  test: {
    environment: "jsdom",
    globals: true, // permet d'utiliser describe/it/expect sans import
    setupFiles: ["./vitest.setup.ts"], // fichier de setup optionnel
  },
})