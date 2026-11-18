// =============================================================================
// PAGE NOUVEAU PRODUIT
// =============================================================================

import { connection } from "next/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductForm } from "../ProductForm"
import { createProduct } from "../actions"
import type { Category } from "@/lib/types/shop"

export const instant = false

export default async function NouveauProduitPage() {
  await connection()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle()
  if (!shop) redirect("/dashboard/onboarding")

  const { data: categories } = await supabase
    .from("categories")
    .select("id, shop_id, name, slug, position, created_at")
    .eq("shop_id", shop.id)
    .order("position", { ascending: true })

  // ✅ Le wrapper DOIT être marqué "use server" pour être sérialisable
  //    et invocable depuis le Client Component.
  async function action(_prev: unknown, formData: FormData) {
    "use server"
    return createProduct(formData)
  }

    return (
    <section className="space-y-6">
        <h1 className="text-xl font-semibold">Nouveau produit</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
        {/* clé dashboard.products.images.createNote */}
        Vous pourrez ajouter des images juste après la création du produit.
        </p>
        <ProductForm
        mode="create"
        categories={(categories ?? []) as Category[]}
        action={action}
        />
    </section>
    )
}