'use client'

import type { ElementType } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PANEL_BORDER, PANEL_ICON_ACTIVE, PANEL_ICON_IDLE, PANEL_NAV_ACTIVE, PANEL_NAV_IDLE, PANEL_SHELL_BLUR } from '@/lib/panel-theme'
import { NAV_ITEMS } from '../constants'
import type { AdminSection } from '../types'
import { canAccessAdminSection, type SessionRoleContext } from '@/lib/permissions'

const MOBILE_PRIMARY: AdminSection[] = ['dashboard', 'tables', 'schedules', 'users', 'settings']

export function AdminMobileNav({
  activeSection,
  onSelect,
  onOpenMore,
  roleContext,
}: {
  activeSection: AdminSection
  onSelect: (section: AdminSection) => void
  onOpenMore: () => void
  roleContext: SessionRoleContext
}) {
  const visibleItems = NAV_ITEMS.filter((item) => canAccessAdminSection(roleContext, item.id))
  const primaryItems = MOBILE_PRIMARY.filter((id) => visibleItems.some((item) => item.id === id)).slice(0, 3)
  const isMoreActive = !primaryItems.includes(activeSection) && visibleItems.some((item) => item.id === activeSection)

  return (
    <nav
      className={cn('fixed inset-x-0 bottom-0 z-50 border-t lg:hidden', PANEL_BORDER, PANEL_SHELL_BLUR)}
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {primaryItems.map((sectionId) => {
          const item = visibleItems.find((entry) => entry.id === sectionId)
          if (!item) return null
          const Icon = item.icon as ElementType
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                'flex min-h-[52px] min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors',
                isActive ? PANEL_NAV_ACTIVE : PANEL_NAV_IDLE
              )}
            >
              <Icon className={cn('h-5 w-5', isActive ? PANEL_ICON_ACTIVE : PANEL_ICON_IDLE)} />
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={onOpenMore}
          className={cn(
            'flex min-h-[52px] min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors',
            isMoreActive ? PANEL_NAV_ACTIVE : PANEL_NAV_IDLE
          )}
        >
          <MoreHorizontal className={cn('h-5 w-5', isMoreActive ? PANEL_ICON_ACTIVE : PANEL_ICON_IDLE)} />
          <span>Más</span>
        </button>
      </div>
    </nav>
  )
}

export function getAdminSectionLabel(section: AdminSection): string {
  return NAV_ITEMS.find((item) => item.id === section)?.label ?? 'Panel'
}
