// =============================================================================
// IMAGE UPLOADER — Composant réutilisable
// -----------------------------------------------------------------------------
// Affiche un aperçu de l'image actuelle (ou d'un placeholder), permet de
// sélectionner un fichier, et compresse automatiquement le fichier choisi.
//
// Le fichier compressé remplace celui de l'input via DataTransfer, ce qui
// garantit que le formulaire parent soumet bien la version compressée, sans
// avoir à gérer un state supplémentaire.
//
// Usage :
//   <ImageUploader
//     name="logo"
//     currentUrl={shop?.logo_url}
//     label="Logo de la boutique"
//     aspectRatio="square"
//   />
// =============================================================================

"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { compressImage, validateImageFile } from "@/lib/utils/compress-image"

interface ImageUploaderProps {
  /** Nom du champ dans le FormData (ex: "logo") */
  name: string
  /** URL de l'image actuelle (pour édition) */
  currentUrl?: string | null
  /** Libellé affiché au-dessus de la zone */
  label: string
  /** Format d'aperçu */
  aspectRatio?: "square" | "wide"
  /** Champ requis côté HTML */
  required?: boolean
}

export function ImageUploader({
  name,
  currentUrl,
  label,
  aspectRatio = "square",
  required = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)

    // 1. Validation basique (type MIME, taille brute, décodabilité)
    // ⚠️ validateImageFile est ASYNCHRONE (elle vérifie que le navigateur
    //    peut réellement décoder l'image) → await obligatoire.
    const validation = await validateImageFile(file, 10)
    if (!validation.ok) {
      setError(validation.reason)
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    // 2. Compression
    setCompressing(true)
    try {
      const compressed = await compressImage(file)

      // 3. Garantir que l'objet est bien un File.
      //    `browser-image-compression` peut retourner un Blob selon la version
      //    et le navigateur. DataTransferItemList.add() exige un File natif.
      let fileToUpload: File
      if (compressed instanceof File) {
        fileToUpload = compressed
      } else {
        // compressed est un Blob : on le convertit en File.
        // On réutilise le nom d'origine, et on force le type WebP
        // (la compression produit du WebP même si le nom d'origine est .jpg).
        fileToUpload = new File([compressed], file.name.replace(/\.[^.]+$/, ".webp"), {
          type: "image/webp",
          lastModified: Date.now(),
        })
      }

      // 4. Remplace le fichier dans l'input via DataTransfer.
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(fileToUpload) // ← maintenant c'est bien un File
      if (inputRef.current) {
        inputRef.current.files = dataTransfer.files
      }

      // 5. Aperçu
      setPreview(URL.createObjectURL(fileToUpload))
    } catch (err) {
      console.error("Erreur de compression détaillée :", err)
      setError("La compression de l'image a échoué. Essayez une autre image.")
      if (inputRef.current) inputRef.current.value = ""
    } finally {
      setCompressing(false)
    }
  }

  const dimensions = aspectRatio === "square" ? 120 : 120

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>{label}</label>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Aperçu */}
        <div
          style={{
            width: dimensions,
            height: aspectRatio === "square" ? dimensions : 80,
            border: "1px dashed #ccc",
            borderRadius: 8,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fafafa",
            flexShrink: 0,
          }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Aperçu"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: "0.75rem", color: "#999" }}>Aucune</span>
          )}
        </div>

        {/* Input */}
        <div style={{ display: "grid", gap: "0.25rem" }}>
          <input
            ref={inputRef}
            type="file"
            name={name}
            accept="image/*"
            required={required && !currentUrl}
            onChange={handleChange}
            disabled={compressing}
            style={{ fontSize: "0.85rem" }}
          />
          {compressing && (
            <span style={{ fontSize: "0.75rem", color: "#666" }}>
              Compression en cours…
            </span>
          )}
          {error && (
            <span role="alert" style={{ fontSize: "0.75rem", color: "crimson" }}>
              {error}
            </span>
          )}
          <span style={{ fontSize: "0.7rem", color: "#888" }}>
            JPG, PNG ou WebP — compressé automatiquement en WebP.
          </span>
        </div>
      </div>
    </div>
  )
}