// =============================================================================
// SIDEBAR DU DASHBOARD (Client Component)
// -----------------------------------------------------------------------------
// - Affiche le nom et le logo de la boutique
// - Liste les liens avec état actif (via usePathname)
// - Gère l'ouverture/fermeture sur mobile (drawer)
// - Contient la Server Action `logout`
// - Affiche un badge numérique sur « Demandes » si non-lues > 0
//
// Libellés fournis par next-intl (`dashboard.nav`, `dashboard.sidebar`,
// `dashboard.logout`).
// Supporte le dark mode via les variantes Tailwind `dark:`.
// =============================================================================

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { NAV_ITEMS } from "@/lib/constants/navigation"
import { logout } from "@/app/dashboard/actions"

interface SidebarProps {
  shopName: string
  shopSlug: string
  shopLogoUrl: string | null
  /** Compteur de demandes non lues, affiché en badge sur « Demandes » */
  unreadInquiries: number
}

export function Sidebar({
  shopName,
  shopSlug,
  shopLogoUrl,
  unreadInquiries,
}: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const tNav = useTranslations("dashboard.nav")
  const tSidebar = useTranslations("dashboard.sidebar")
  const tLogout = useTranslations("dashboard")

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Bouton burger (mobile) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={tSidebar("openMenu")}
        className="md:hidden fixed top-3 left-3 z-40 p-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow"
      >
        <span className="block w-5 h-0.5 bg-gray-800 dark:bg-gray-200 mb-1" />
        <span className="block w-5 h-0.5 bg-gray-800 dark:bg-gray-200 mb-1" />
        <span className="block w-5 h-0.5 bg-gray-800 dark:bg-gray-200" />
      </button>

      {/* Overlay mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 flex flex-col
          bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* En-tête : logo + nom + lien vitrine */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          {shopLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shopLogoUrl}
              alt=""
              className="w-10 h-10 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-primary text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
              {tSidebar("logoPlaceholder")}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">
              {shopName}
            </p>
            <Link
              href={`/${shopSlug}`}
              className="link-underline text-xs text-gray-500 dark:text-gray-400"
              target="_blank"
            >
              {tSidebar("viewShop")} ↗
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={tSidebar("closeMenu")}
            className="md:hidden ml-auto text-gray-500 dark:text-gray-400"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href)
              const showBadge =
                item.key === "inquiries" && unreadInquiries > 0
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded text-sm
                      ${active
                        ? "bg-primary text-white font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"}
                    `}
                  >
                    <span
                      aria-hidden="true"
                      className={active ? "text-white/80" : "text-gray-400 dark:text-gray-500"}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1">{tNav(item.labelKey)}</span>
                    {showBadge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                          active
                            ? "bg-white text-primary"
                            : "bg-primary text-white"
                        }`}
                        aria-label={`${unreadInquiries} unread`}
                      >
                        {unreadInquiries > 9 ? "9+" : unreadInquiries}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Déconnexion */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              {tLogout("logout")}
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}