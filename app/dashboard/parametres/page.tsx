// =============================================================================
// PAGE PARAMÈTRES (coquille — Phase 3)
// -----------------------------------------------------------------------------
// Sera remplie en Phase 3 avec les trois sélecteurs :
//   - thème (mode + couleur)
//   - langue (FR / EN)
//   - disposition du catalogue
// =============================================================================

import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
import { connection } from "next/server"
import {ParametresClient} from "./ParametresClient";

// ✅ Autorise un rendu bloquant pour cette page
export const instant = false

export default async function ParametresPage() {
  // ✅ Indique à Next.js que ce composant doit être rendu à la requête
  // avant tout accès à des données dynamiques (cookies, date, etc.)
  await connection()

  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const {data: shop} = await supabase
    .from("shops")
    .select("theme_mode, primary_color, language, catalog_layout")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!shop) redirect("/dashboard/onboarding");

  return (
    <ParametresClient
        key={`${shop.theme_mode}-${shop.language}-${shop.catalog_layout}-${shop.primary_color}`}
        shop={shop}
    />
  );
}