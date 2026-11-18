import { connection } from "next/server"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductForm } from "../../ProductForm"
import { updateProduct } from "../../actions"
import { ProductImageUploader } from "./ProductImageUploader"
import type { Category, Product, ProductImageWithUrl } from "@/lib/types/shop"

export const instant = false

export default async function EditerProduitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle()
  if (!shop) redirect("/dashboard/onboarding")

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("shop_id", shop.id)
    .maybeSingle()
  if (error || !product) notFound()

  const [{ data: categories }, { data: images }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, shop_id, name, slug, position, created_at")
      .eq("shop_id", shop.id)
      .order("position", { ascending: true }),
    supabase
      .from("product_images")
      .select("*")
      .eq("product_id", id)
      .order("position", { ascending: true }),
  ])

  // Résoudre les URLs publiques
  const imagesWithUrl: ProductImageWithUrl[] = (images ?? []).map((img) => {
    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(img.storage_path)
    return {
      ...img,
      public_url: data.publicUrl,
    }
  })

  async function action(_prev: unknown, formData: FormData) {
    "use server"
    return updateProduct(id, formData)
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Modifier le produit</h1>
        <p className="text-xs text-gray-500">/{product.slug}</p>
      </div>

      <ProductForm
        mode="edit"
        product={product as Product}
        categories={(categories ?? []) as Category[]}
        action={action}
      />

      <hr className="border-gray-200 dark:border-gray-700" />

      <ProductImageUploader productId={id} images={imagesWithUrl} />
    </section>
  )
}