// =============================================================================
// VITRINE CLIENT — Recherche, filtres, tri, animation initiale
// -----------------------------------------------------------------------------
// ⚠️ React 19 interdit l'accès à `ref.current` pendant le rendu. On utilise
//    donc `useState` pour l'état `animateCards` :
//      - initialisé à `true` au montage → animation joue
//      - passé à `false` par un `useEffect` + timeout (durée animation + marge)
//      - les interactions suivantes (recherche/filtre/tri) ne rejouent pas
//        l'animation, car `animateCards` est déjà `false`.
//
//    Le timeout est essentiel : retirer la classe `animate-fade-in-up`
//    AVANT la fin de l'animation annulerait visuellement l'effet (remise
//    à l'état "from"). On attend donc que l'animation soit terminée.
// =============================================================================

"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import type { PublicShop, PublicProduct } from "@/lib/vitrine/get-shop-by-slug"
import { SearchBar } from "./_components/SearchBar"
import { CategoryChips } from "./_components/CategoryChips"
import { ProductGrid } from "./_components/ProductGrid"

type SortOption = "newest" | "price-asc" | "price-desc" | "featured"

// Durée de l'animation (400ms) + délai max pour une grille de 6 cartes
// (5 × 40ms) + marge de sécurité → 1000ms couvre tous les cas.
const ANIMATION_TOTAL_MS = 1000

export function VitrineClient({
  shop,
  categories,
  products,
  noResultsText,
}: {
  shop: PublicShop
  categories: Array<{ id: string; name: string; product_count: number }>
  products: PublicProduct[]
  noResultsText: { title: string; hint: string }
}) {
  const t = useTranslations("vitrine.filters")
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>("featured")

  // Animation d'entrée : active uniquement au premier rendu.
  // Après ANIMATION_TOTAL_MS, on repasse à `false` → aucune animation
  // ne sera rejouée si l'utilisateur filtre ou cherche.
  const [animateCards, setAnimateCards] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setAnimateCards(false), ANIMATION_TOTAL_MS)
    return () => clearTimeout(timer)
  }, [])

  const filtered = useMemo(() => {
    let result = products

    // 1. Filtre catégorie
    if (categoryId) {
      result = result.filter((p) => p.category_id === categoryId)
    }

    // 2. Recherche (nom + description + catégorie)
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          (p.category_name ?? "").toLowerCase().includes(q)
      )
    }

    // 3. Tri
    const sorted = [...result]
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => {
          if (a.price === null) return 1
          if (b.price === null) return -1
          return a.price - b.price
        })
        break
      case "price-desc":
        sorted.sort((a, b) => {
          if (a.price === null) return 1
          if (b.price === null) return -1
          return b.price - a.price
        })
        break
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        break
      case "featured":
      default:
        // Déjà trié par is_featured desc puis created_at desc côté serveur
        break
    }

    return sorted
  }, [products, categoryId, search, sort])

  return (
    <div id="produits" className="space-y-6">
      {/* Barre sticky : recherche + filtres + tri ------------------------- */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-surface/90 backdrop-blur border-b border-border">
        <div className="space-y-3">
          <SearchBar value={search} onChange={setSearch} />
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <CategoryChips
                categories={categories}
                selected={categoryId}
                onSelect={setCategoryId}
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="shrink-0 px-3 py-2 rounded-lg border border-border bg-surface-muted text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="featured">{t("featuredFirst")}</option>
              <option value="newest">{t("sortNewest")}</option>
              <option value="price-asc">{t("sortPriceAsc")}</option>
              <option value="price-desc">{t("sortPriceDesc")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grille ou message vide ------------------------------------------- */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg font-medium text-on-surface">{noResultsText.title}</p>
          <p className="text-sm text-on-surface-muted mt-1">{noResultsText.hint}</p>
        </div>
      ) : (
        <ProductGrid
          products={filtered}
          shopSlug={shop.slug}
          layout={shop.catalog_layout}
          animate={animateCards}
        />
      )}
    </div>
  )
}