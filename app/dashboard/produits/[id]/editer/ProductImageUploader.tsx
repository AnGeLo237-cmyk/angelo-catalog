// =============================================================================
// PRODUCT IMAGE UPLOADER — Drag & drop + upload multiple
// -----------------------------------------------------------------------------
// Flux :
//   1. Utilisateur sélectionne un ou plusieurs fichiers
//   2. Chaque fichier est compressé côté client (compressImage)
//   3. Appel Server Action uploadProductImage pour chaque fichier
//   4. router.refresh() après chaque upload (ou en batch à la fin)
//
// Réorganisation : drag & drop via @dnd-kit (position 0 = image principale).
// Suppression : confirmation + deleteProductImage.
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
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ProductImageWithUrl } from "@/lib/types/shop"
import {
  uploadProductImage,
  deleteProductImage,
  reorderProductImages,
} from "./actions-images"
import { compressImage, validateImageFile } from "@/lib/utils/compress-image"
import {
  MAX_IMAGES_PER_PRODUCT,
  validateImageForUpload,
} from "@/lib/validation/product-image"

export function ProductImageUploader({
  productId,
  images: initialImages,
}: {
  productId: string
  images: ProductImageWithUrl[]
}) {
  const t = useTranslations("dashboard.products.images")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<ProductImageWithUrl[]>(initialImages)

  // Sync avec le serveur après router.refresh()
  if (
    initialImages.length !== images.length ||
    initialImages.some((img, i) => img.id !== images[i]?.id)
  ) {
    setImages(initialImages)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setError(null)
    setUploading(true)

    const files = Array.from(fileList)
    let currentCount = images.length

    for (const file of files) {
      // Limite globale
      if (currentCount >= MAX_IMAGES_PER_PRODUCT) {
        setError(t("maxReached", { count: MAX_IMAGES_PER_PRODUCT }))
        break
      }

      // Validation basique
      const basicValidation = validateImageForUpload(file, currentCount)
      if (!basicValidation.ok) {
        setError(basicValidation.reason ?? t("genericError"))
        continue
      }

      // Vérification de décodabilité + compression
      const decodeValidation = await validateImageFile(file)
      if (!decodeValidation.ok) {
        setError(decodeValidation.reason)
        continue
      }

      let compressed: File
      try {
        compressed = await compressImage(file)
      } catch {
        setError(t("compressionFailed"))
        continue
      }

      // Upload via Server Action
      const formData = new FormData()
      formData.append("file", compressed)
      const result = await uploadProductImage(productId, formData)
      if (!result.success) {
        setError(result.error)
      } else {
        currentCount++
      }
    }

    setUploading(false)
    router.refresh()
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = images.findIndex((i) => i.id === active.id)
    const newIndex = images.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(images, oldIndex, newIndex)
    setImages(reordered)

    startTransition(async () => {
      const result = await reorderProductImages(
        productId,
        reordered.map((i) => i.id)
      )
      if (result.success) router.refresh()
      else {
        setError(result.error)
        setImages(initialImages)
      }
    })
  }

  function handleDelete(imageId: string) {
    if (!confirm(t("deleteConfirm"))) return
    setError(null)
    startTransition(async () => {
      const result = await deleteProductImage(productId, imageId)
      if (result.success) router.refresh()
      else setError(result.error)
    })
  }

  const canAddMore = images.length < MAX_IMAGES_PER_PRODUCT
  const busy = uploading || isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {t("title")}
        </h2>
        <span className="text-xs text-gray-500">
          {images.length}/{MAX_IMAGES_PER_PRODUCT}
        </span>
      </div>

      {images.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>
      )}

      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((i) => i.id)}
            strategy={rectSortingStrategy}
          >
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {images.map((img, idx) => (
                <ImageTile
                  key={img.id}
                  image={img}
                  isMain={idx === 0}
                  disabled={busy}
                  onDelete={() => handleDelete(img.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {canAddMore && (
        <label
          className="flex items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer
                     border-gray-300 dark:border-gray-600 hover:border-primary
                     text-sm text-gray-600 dark:text-gray-400"
        >
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          {uploading ? t("uploading") : t("addHint", { count: MAX_IMAGES_PER_PRODUCT - images.length })}
        </label>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

function ImageTile({
  image,
  isMain,
  disabled,
  onDelete,
}: {
  image: ProductImageWithUrl
  isMain: boolean
  disabled: boolean
  onDelete: () => void
}) {
  const t = useTranslations("dashboard.products.images")
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="aspect-square rounded overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-grab touch-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.public_url}
          alt={image.alt_text ?? ""}
          className="w-full h-full object-cover"
        />
      </div>
      {isMain && (
        <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-primary text-white font-medium">
          {t("main")}
        </span>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        aria-label={t("delete")}
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white text-xs
                   opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </li>
  )
}