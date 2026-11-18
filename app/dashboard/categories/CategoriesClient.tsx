// =============================================================================
// CATEGORIES CLIENT — Drag & drop + modale d'édition
// -----------------------------------------------------------------------------
// Utilise @dnd-kit pour réordonner. Chaque opération réussie déclenche
// router.refresh() pour recharger les données serveur.
//
// Le formulaire est dans une modale (CategoryModal) pour rester sur la
// même page. L'ajout, la modification et la suppression partagent la
// même modale avec un mode différent.
// =============================================================================

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Category } from "@/lib/types/shop"
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "./actions"
import { CategoryModal } from "./CategoryModal"

export function CategoriesClient({ categories }: { categories: Category[] }) {
  const t = useTranslations("dashboard.categories")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // État local pour permettre le drag sans attendre le serveur
  const [items, setItems] = useState<Category[]>(categories)

  // Modale : null = fermée ; { mode: "create" } ; { mode: "edit", category }
  const [modal, setModal] = useState<
    | null
    | { mode: "create" }
    | { mode: "edit"; category: Category }
  >(null)

  // Sync des items quand le serveur renvoie de nouvelles props
  // (après router.refresh(), le parent renvoie de nouvelles `categories`)
  if (
    categories.length !== items.length ||
    categories.some((c, i) => c.id !== items[i]?.id)
  ) {
    setItems(categories)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((c) => c.id === active.id)
    const newIndex = items.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered) // mise à jour optimiste

    startTransition(async () => {
      const result = await reorderCategories(reordered.map((c) => c.id))
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error)
        setItems(items) // rollback
      }
    })
  }

  function handleDelete(category: Category) {
    if (!confirm(t("deleteConfirm"))) return
    setError(null)
    startTransition(async () => {
      const result = await deleteCategory(category.id)
      if (result.success) router.refresh()
      else setError(result.error)
    })
  }

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t("subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          className="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90"
        >
          + {t("add")}
        </button>
      </header>

      {items.length === 0 ? (
        <div className="border border-dashed rounded p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>{t("empty")}</p>
          <p className="mt-1">{t("emptyHint")}</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {items.map((c) => (
                <CategoryRow
                  key={c.id}
                  category={c}
                  disabled={isPending}
                  onEdit={() => setModal({ mode: "edit", category: c })}
                  onDelete={() => handleDelete(c)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {modal && (
        <CategoryModal
          mode={modal.mode}
          category={modal.mode === "edit" ? modal.category : undefined}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null)
            router.refresh()
          }}
        />
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Ligne draggable
// ---------------------------------------------------------------------------
function CategoryRow({
  category,
  disabled,
  onEdit,
  onDelete,
}: {
  category: Category
  disabled: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const t = useTranslations("dashboard.categories")
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2"
    >
      {/* Poignée de drag */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={t("reorder")}
        className="cursor-grab touch-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        ⋮⋮
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {category.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("productCount", { count: category.product_count ?? 0 })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {t("edit")}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
        >
          {t("delete")}
        </button>
      </div>
    </li>
  )
}