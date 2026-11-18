// =============================================================================
// COMPRESSION D'IMAGE CÔTÉ CLIENT
// -----------------------------------------------------------------------------
// Compresse un File image avant upload vers Supabase Storage.
//
// Objectifs :
//   - Réduire le poids (limite plan gratuit : 50 Mo par fichier, 1 Go total)
//   - Accélérer l'upload sur mobile (connexions parfois lentes)
//   - Convertir en WebP (meilleur ratio qualité/poids)
//
// ⚠️ Ce module utilise l'API navigateur (Canvas, Web Worker).
//    Il ne doit être importé QUE dans des Client Components ("use client").
// =============================================================================

import imageCompression from "browser-image-compression"

export interface CompressOptions {
  /** Poids cible maximum après compression (Mo). Défaut : 0,5 Mo. */
  maxSizeMB?: number
  /** Dimension max (largeur ou hauteur). Défaut : 1600 px. */
  maxWidthOrHeight?: number
}

/**
 * Compresse un fichier image et retourne un nouveau File en WebP.
 * Lève une erreur si la compression échoue.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const { maxSizeMB = 0.5, maxWidthOrHeight = 1600 } = options

  try {
    return await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
    })
  } catch (workerError) {
    // Fallback : sans worker, si le worker échoue (navigateur restrictif)
    console.warn("Compression avec worker échouée, fallback sans worker :", workerError)
    return await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: false,
    })
  }
}

/**
 * Vérifie qu'un fichier est une image et ne dépasse pas la taille brute max.
 * À appeler AVANT compressImage() pour rejeter les cas aberrants
 * (ex: un utilisateur qui uploade un PDF renommé en .jpg).
 */
export async function validateImageFile(
  file: File,
  maxRawSizeMB = 10
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, reason: "Le fichier doit être une image." }
  }
  if (file.size > maxRawSizeMB * 1024 * 1024) {
    return { ok: false, reason: `L'image ne doit pas dépasser ${maxRawSizeMB} Mo avant compression.` }
  }

  // Vérifie que le navigateur peut réellement décoder l'image
  const url = URL.createObjectURL(file)
  try {
    await new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("Image non décodable"))
      img.src = url
    })
    return { ok: true }
  } catch {
    return { ok: false, reason: "Ce fichier image n'est pas lisible par le navigateur." }
  } finally {
    URL.revokeObjectURL(url)
  }
}