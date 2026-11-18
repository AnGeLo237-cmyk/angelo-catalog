// =============================================================================
// FORMULAIRE D'ONBOARDING (Client Component)
// -----------------------------------------------------------------------------
// ⚠️ Ce formulaire est en FRANÇAIS uniquement (décision validée) : la langue
//    de la boutique n'existe pas encore, elle est choisie ici et prendra effet
//    à partir de la Phase 3.
//
// Utilise `useActionState` (React 19) pour gérer l'état retourné par le
// Server Action (erreurs par champ, message global).
// =============================================================================

"use client"

import { useActionState } from "react"
import { createShop, type CreateShopState } from "./actions"
import { ImageUploader } from "@/components/ImageUploader"

const initialState: CreateShopState = { success: false }

const labelStyle = { fontSize: "0.9rem", fontWeight: 500 } as const
const fieldStyle = {
  padding: "0.5rem",
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: "1rem",
} as const

export function OnboardingForm({ defaultEmail }: { defaultEmail: string | null }) {
  const [state, formAction, isPending] = useActionState(createShop, initialState)

  return (
    <form
      action={formAction}
      style={{ display: "grid", gap: "1.25rem" }}
    >
      {/* ---------- Nom ---------- */}
      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span style={labelStyle}>Nom de la boutique *</span>
        <input
          type="text"
          name="name"
          required
          maxLength={100}
          style={fieldStyle}
          placeholder="Ex : Boutique Marie"
        />
        {state.errors?.name && (
          <span style={{ color: "crimson", fontSize: "0.8rem" }}>
            {state.errors.name}
          </span>
        )}
      </label>

      {/* ---------- Description ---------- */}
      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span style={labelStyle}>Description</span>
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          style={fieldStyle}
          placeholder="Quelques mots sur votre boutique (facultatif)"
        />
        {state.errors?.description && (
          <span style={{ color: "crimson", fontSize: "0.8rem" }}>
            {state.errors.description}
          </span>
        )}
      </label>

      {/* ---------- WhatsApp ---------- */}
      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span style={labelStyle}>Numéro WhatsApp *</span>
        <input
          type="tel"
          name="whatsapp_number"
          required
          style={fieldStyle}
          placeholder="+237 6XX XXX XXX"
        />
        {state.errors?.whatsapp_number && (
          <span style={{ color: "crimson", fontSize: "0.8rem" }}>
            {state.errors.whatsapp_number}
          </span>
        )}
      </label>

      {/* ---------- Email de contact ---------- */}
      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span style={labelStyle}>Email de contact</span>
        <input
          type="email"
          name="contact_email"
          defaultValue={defaultEmail ?? ""}
          style={fieldStyle}
        />
        {state.errors?.contact_email && (
          <span style={{ color: "crimson", fontSize: "0.8rem" }}>
            {state.errors.contact_email}
          </span>
        )}
      </label>

      {/* ---------- Langue de l'interface ---------- */}
      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span style={labelStyle}>Langue de l&apos;interface *</span>
        <select name="language" defaultValue="fr" style={fieldStyle}>
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
        <span style={{ fontSize: "0.75rem", color: "#888" }}>
          Appliquée après création (le contenu que vous saisirez n&apos;est pas traduit).
        </span>
      </label>

      {/* ---------- Mode clair/sombre ---------- */}
      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span style={labelStyle}>Mode d&apos;affichage *</span>
        <select name="theme_mode" defaultValue="light" style={fieldStyle}>
          <option value="light">Clair</option>
          <option value="dark">Sombre</option>
          <option value="system">Automatique</option>
        </select>
      </label>

      {/* ---------- Couleur principale ---------- */}
      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span style={labelStyle}>Couleur principale *</span>
        <input
          type="color"
          name="primary_color"
          defaultValue="#3ecf8e"
          style={{ width: 80, height: 40, border: "1px solid #ccc", borderRadius: 6 }}
        />
        {state.errors?.primary_color && (
          <span style={{ color: "crimson", fontSize: "0.8rem" }}>
            {state.errors.primary_color}
          </span>
        )}
      </label>

      {/* ---------- Disposition du catalogue ---------- */}
      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span style={labelStyle}>Disposition du catalogue *</span>
        <select name="catalog_layout" defaultValue="grid-3" style={fieldStyle}>
          <option value="grid-2">Grille 2 colonnes</option>
          <option value="grid-3">Grille 3 colonnes (recommandé)</option>
          <option value="grid-4">Grille 4 colonnes</option>
          <option value="list">Liste détaillée</option>
        </select>
      </label>

      {/* ---------- Logo ---------- */}
      <ImageUploader
        name="logo"
        label="Logo de la boutique"
        aspectRatio="square"
      />

      {/* ---------- Message global ---------- */}
      {state.message && (
        <p role="alert" style={{ color: "crimson" }}>
          {state.message}
        </p>
      )}

      {/* ---------- Soumission ---------- */}
      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: "0.75rem",
          cursor: isPending ? "wait" : "pointer",
          fontWeight: 600,
        }}
      >
        {isPending ? "Création en cours…" : "Créer ma boutique"}
      </button>
    </form>
  )
}