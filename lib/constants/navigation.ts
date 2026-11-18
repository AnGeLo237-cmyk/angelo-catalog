// =============================================================================
// CONSTANTES DE NAVIGATION
// -----------------------------------------------------------------------------
// `labelKey` DOIT contenir la clé de traduction (dashboard, products, ...),
// pas le libellé français. Le libellé est fourni par next-intl au moment
// du rendu, via le namespace `dashboard.nav`.
// =============================================================================

export const NAV_ITEMS = [
  { key: "dashboard",  href: "/dashboard",              labelKey: "dashboard",  icon: "◧" },
  { key: "products",   href: "/dashboard/produits",     labelKey: "products",   icon: "▤" },
  { key: "categories", href: "/dashboard/categories",   labelKey: "categories", icon: "▥" },
  { key: "inquiries",  href: "/dashboard/demandes",     labelKey: "inquiries",  icon: "✉" },
  { key: "stats",      href: "/dashboard/statistiques", labelKey: "stats",      icon: "◔" },
  { key: "settings",   href: "/dashboard/parametres",   labelKey: "settings",   icon: "⚙" },
] as const