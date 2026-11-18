// =============================================================================
// CART SHELL — Conteneur d'état local pour bouton + drawer
// -----------------------------------------------------------------------------
// Le drawer est piloté par un état local. Le bouton flottant ouvre le drawer.
// Placé dans le layout [slug], ce composant reste monté pendant toute la
// navigation entre les pages de la boutique → le drawer ne se "referme" pas
// au changement de page.
// =============================================================================

"use client"

import { useState } from "react"
import { CartButton } from "./CartButton"
import { CartDrawer } from "./CartDrawer"

export function CartShell({
  shopName,
  shopSlug,
  whatsappNumber,
}: {
  shopName: string
  shopSlug: string
  whatsappNumber: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {!open && <CartButton onOpen={() => setOpen(true)} />}
      <CartDrawer
        open={open}
        onClose={() => setOpen(false)}
        shopName={shopName}
        shopSlug={shopSlug}
        whatsappNumber={whatsappNumber}
      />
    </>
  )
}