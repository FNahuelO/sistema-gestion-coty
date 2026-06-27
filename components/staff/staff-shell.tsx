'use client'

import { type ElementType, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { BellRing, ChefHat, LogOut, Truck, Users, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COTY_HEADER, LOGO_SRC_SVG } from '@/lib/coty-theme'
import {
  PANEL_BG,
  PANEL_BORDER,
  PANEL_BTN_GHOST,
  PANEL_NAV_ACTIVE,
  PANEL_NAV_IDLE,
  PANEL_SHELL,
  PANEL_SHELL_BLUR,
} from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/store'
import { MobileShellPadding } from '@/components/admin/ui/mobile-shell-padding'
import { AdminThemeToggle } from '@/components/admin/ui/theme-toggle'

export type StaffSection = 'orders' | 'tables' | 'kitchen' | 'delivery' | 'calls' | 'cash'

const NAV_ITEMS: { id: StaffSection; label: string; icon: ElementType }[] = [
  { id: 'orders', label: 'Pedidos', icon: ChefHat },
  { id: 'kitchen', label: 'Cocina', icon: ChefHat },
  { id: 'tables', label: 'Mesas', icon: Users },
  { id: 'delivery', label: 'Cadetes', icon: Truck },
  { id: 'calls', label: 'Mozos', icon: BellRing },
  { id: 'cash', label: 'Caja', icon: Wallet },
]

const SECTION_LABELS: Record<StaffSection, string> = {
  orders: 'Pedidos',
  kitchen: 'Cocina',
  tables: 'Mesas',
  delivery: 'Cadetes',
  calls: 'Llamados',
  cash: 'Caja',
}

export function StaffShell({
  activeSection,
  onSectionChange,
  children,
  sectionAlerts,
  sections,
}: {
  activeSection: StaffSection
  onSectionChange: (section: StaffSection) => void
  children: ReactNode
  sectionAlerts?: Partial<Record<StaffSection, boolean>>
  sections?: StaffSection[]
}) {
  const router = useRouter()
  const { user, logout } = useAuth()

  const navItems = sections
    ? NAV_ITEMS.filter((item) => sections.includes(item.id))
    : NAV_ITEMS

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className={cn('flex min-h-screen', PANEL_BG)}>
      <aside className={cn('hidden w-72 shrink-0 border-r lg:flex lg:flex-col', PANEL_BORDER, PANEL_SHELL)}>
        <StaffSideNav
          activeSection={activeSection}
          onSelect={onSectionChange}
          onLogout={() => void handleLogout()}
          userName={user?.name}
          sectionAlerts={sectionAlerts}
          navItems={navItems}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn('sticky top-0 z-40 border-b', PANEL_BORDER, PANEL_SHELL_BLUR)}
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full lg:hidden"
                style={{ backgroundColor: COTY_HEADER }}
              >
                <img src={LOGO_SRC_SVG} alt="Coty Cafe" className="h-auto w-5 object-contain" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-serif text-base font-bold leading-tight text-foreground">{SECTION_LABELS[activeSection]}</p>
                <p className="truncate text-[10px] text-muted-foreground lg:hidden">
                  {user?.name ? `${user.name} · ` : ''}Operaciones
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <AdminThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void handleLogout()}
                aria-label="Cerrar sesión"
                className={cn('h-11 w-11', PANEL_BTN_GHOST)}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 py-4 sm:px-4 sm:py-5 md:px-6">
          {children}
          <MobileShellPadding />
        </main>

        <nav
          className={cn('fixed inset-x-0 bottom-0 z-50 border-t lg:hidden', PANEL_BORDER, PANEL_SHELL_BLUR)}
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto flex max-w-lg overflow-x-auto px-1 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              const hasAlert = sectionAlerts?.[item.id]
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    'flex min-h-[52px] min-w-[72px] shrink-0 flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[10px] font-medium',
                    isActive ? PANEL_NAV_ACTIVE : PANEL_NAV_IDLE
                  )}
                  aria-label={hasAlert ? `${item.label}, comandas nuevas` : item.label}
                >
                  <span className="relative">
                    <Icon className={cn('h-5 w-5', isActive ? 'text-[#2D5A57]' : 'text-[#7EB8B3]')} />
                    {hasAlert ? <StaffNavAlertDot className="ring-white dark:ring-card" /> : null}
                  </span>
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}

function StaffNavAlertDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2',
        className
      )}
      aria-hidden
    />
  )
}

function StaffSideNav({
  activeSection,
  onSelect,
  onLogout,
  userName,
  sectionAlerts,
  navItems,
}: {
  activeSection: StaffSection
  onSelect: (section: StaffSection) => void
  onLogout: () => void
  userName?: string
  sectionAlerts?: Partial<Record<StaffSection, boolean>>
  navItems: { id: StaffSection; label: string; icon: ElementType }[]
}) {
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
            <p className="font-serif text-xl font-bold leading-tight dark:text-white">Coty Cafe</p>
            <p className="text-xs text-muted-foreground">Panel de Operaciones</p>
            {userName ? <p className="mt-1 text-xs font-medium text-[#2D5A57]">{userName}</p> : null}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Cerrar sesión" className="h-11 w-11 shrink-0">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          const hasAlert = sectionAlerts?.[item.id]
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                'flex w-full min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                isActive ? PANEL_NAV_ACTIVE : PANEL_NAV_IDLE
              )}
              aria-label={hasAlert ? `${item.label}, comandas nuevas` : item.label}
            >
              <span className="relative shrink-0">
                <Icon className={cn('h-5 w-5', isActive ? 'text-[#2D5A57]' : 'text-[#7EB8B3]')} />
                {hasAlert ? <StaffNavAlertDot className="ring-white dark:ring-card" /> : null}
              </span>
              <span className="flex-1">{item.label}</span>
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

export function StaffPageHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="mb-4 lg:mb-4">
      <h2 className="text-base font-semibold text-foreground sm:text-sm">{title}</h2>
      {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
    </div>
  )
}
