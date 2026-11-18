"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type ActionResult = { success: true } | { success: false; error: string }

async function getOwnedShopId(): Promise<
  { shopId: string } | { error: string }
> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) return { error: "Session expirée." }
  if (!user) return { error: "Vous devez être connecté." }

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!shop) return { error: "Boutique introuvable." }
  return { shopId: shop.id }
}

export async function toggleInquiryRead(
  inquiryId: string,
  isRead: boolean
): Promise<ActionResult> {
  const owned = await getOwnedShopId()
  if ("error" in owned) return { success: false, error: owned.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("inquiries")
    .update({ is_read: isRead })
    .eq("id", inquiryId)
    .eq("shop_id", owned.shopId)
    .select("id")

  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) {
    return { success: false, error: "Demande introuvable." }
  }

  revalidatePath("/dashboard/demandes")
  return { success: true }
}

export async function deleteInquiry(inquiryId: string): Promise<ActionResult> {
  const owned = await getOwnedShopId()
  if ("error" in owned) return { success: false, error: owned.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("inquiries")
    .delete()
    .eq("id", inquiryId)
    .eq("shop_id", owned.shopId)
    .select("id")

  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) {
    return { success: false, error: "Demande introuvable." }
  }

  revalidatePath("/dashboard/demandes")
  return { success: true }
}