'use client'

import { type ElementType, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { BellRing, ChefHat, Coffee, LogOut, Truck, Users, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COTY_HEADER } from '@/lib/coty-theme'
import { PANEL_NAV_ACTIVE, PANEL_NAV_IDLE } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/store'
import { MobileShellPadding } from '@/components/admin/ui/mobile-shell-padding'

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
}: {
  activeSection: StaffSection
  onSectionChange: (section: StaffSection) => void
  children: ReactNode
  sectionAlerts?: Partial<Record<StaffSection, boolean>>
}) {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <aside className="hidden w-72 shrink-0 border-r border-gray-100 bg-white lg:flex lg:flex-col">
        <StaffSideNav
          activeSection={activeSection}
          onSelect={onSectionChange}
          onLogout={() => void handleLogout()}
          userName={user?.name}
          sectionAlerts={sectionAlerts}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: COTY_HEADER }}
              >
                <Coffee className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-serif text-base font-bold leading-tight">{SECTION_LABELS[activeSection]}</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {user?.name ? `${user.name} · ` : ''}Operaciones
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => void handleLogout()}
              aria-label="Cerrar sesión"
              className="h-11 w-11 shrink-0 text-[#2D5A57] hover:bg-[#C5DDD9]/40"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 px-3 py-4 sm:px-4 sm:py-5 md:px-6">
          {children}
          <MobileShellPadding />
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-md lg:hidden"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto flex max-w-lg overflow-x-auto px-1 pt-1">
            {NAV_ITEMS.map((item) => {
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
                    {hasAlert ? <StaffNavAlertDot className="ring-white" /> : null}
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
}: {
  activeSection: StaffSection
  onSelect: (section: StaffSection) => void
  onLogout: () => void
  userName?: string
  sectionAlerts?: Partial<Record<StaffSection, boolean>>
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: COTY_HEADER }}
          >
            <Coffee className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-serif text-xl font-bold leading-tight">Coty Cafe</p>
            <p className="text-xs text-muted-foreground">Panel de Operaciones</p>
            {userName ? <p className="mt-1 text-xs font-medium text-[#2D5A57]">{userName}</p> : null}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Cerrar sesión" className="h-11 w-11 shrink-0">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
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
                {hasAlert ? <StaffNavAlertDot className="ring-white" /> : null}
              </span>
              <span className="flex-1">{item.label}</span>
            </button>
          )
        })}
      </nav>
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
