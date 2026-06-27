'use client'

import type { ElementType } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COTY_HEADER, LOGO_SRC_SVG } from '@/lib/coty-theme'
import { PANEL_BORDER, PANEL_ICON_ACTIVE, PANEL_ICON_IDLE, PANEL_NAV_ACTIVE, PANEL_NAV_IDLE } from '@/lib/panel-theme'
import { AdminThemeToggle } from './theme-toggle'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '../constants'
import type { AdminSection } from '../types'
import { canAccessAdminSection, type SessionRoleContext } from '@/lib/permissions'

export function AdminSideNav({
  activeSection,
  onSelect,
  onLogout,
  roleContext,
}: {
  activeSection: AdminSection
  onSelect: (section: AdminSection) => void
  onLogout: () => void
  roleContext: SessionRoleContext
}) {
  const visibleItems = NAV_ITEMS.filter((item) => canAccessAdminSection(roleContext, item.id))
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex items-start justify-between border-b p-5', PANEL_BORDER)}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: COTY_HEADER }}
          >
            <img src={LOGO_SRC_SVG} alt="Coty Cafe" className="h-auto w-7 object-contain" />
          </div>
          <div>
            <p className="font-serif text-xl font-bold leading-tight">Coty Cafe</p>
            <p className="text-xs text-muted-foreground">Panel de Administrador</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Cerrar sesión" className="shrink-0">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const Icon = item.icon as ElementType
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                isActive ? PANEL_NAV_ACTIVE : PANEL_NAV_IDLE
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', isActive ? PANEL_ICON_ACTIVE : PANEL_ICON_IDLE)} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className={cn('hidden border-t p-3 lg:block', PANEL_BORDER)}>
        <div className="flex items-center justify-between rounded-xl px-2 py-1">
          <span className="text-xs text-muted-foreground">Tema</span>
          <AdminThemeToggle className="h-9 w-9" />
        </div>
      </div>
    </div>
  )
}
