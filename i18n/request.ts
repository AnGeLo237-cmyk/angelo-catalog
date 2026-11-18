import { getRequestConfig } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import frMessages from "../messages/fr.json"
import enMessages from "../messages/en.json"

export const COOKIE_NAME = "NEXT_LOCALE"

export default getRequestConfig(async ({ requestLocale }) => {
  // 1. Priorité au cookie (mis à jour par la Server Action)
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(COOKIE_NAME)?.value

  let locale: "fr" | "en" = "fr"

  if (cookieLocale === "en" || cookieLocale === "fr") {
    locale = cookieLocale
  } else {
    // 2. Fallback DB (première visite, cookie absent)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: shop } = await supabase
        .from("shops")
        .select("language")
        .eq("owner_id", user.id)
        .maybeSingle()
      if (shop?.language === "en") locale = "en"
    }
  }

  return { locale, messages: locale === "en" ? enMessages : frMessages }
})