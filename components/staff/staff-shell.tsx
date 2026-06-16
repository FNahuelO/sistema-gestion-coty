'use client'

import { useState, type ElementType, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ChefHat, Coffee, LogOut, Menu, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { COTY_HEADER } from '@/lib/coty-theme'
import { PANEL_NAV_ACTIVE, PANEL_NAV_IDLE } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/store'

export type StaffSection = 'orders' | 'tables'

const NAV_ITEMS: { id: StaffSection; label: string; icon: ElementType }[] = [
  { id: 'orders', label: 'Pedidos', icon: ChefHat },
  { id: 'tables', label: 'Mesas', icon: Users },
]

function StaffSideNav({
  activeSection,
  onSelect,
  onLogout,
  userName,
}: {
  activeSection: StaffSection
  onSelect: (section: StaffSection) => void
  onLogout: () => void
  userName?: string
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
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Cerrar sesión" className="shrink-0">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
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
              <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-[#2D5A57]' : 'text-[#7EB8B3]')} />
              {item.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export function StaffShell({
  activeSection,
  onSectionChange,
  children,
}: {
  activeSection: StaffSection
  onSectionChange: (section: StaffSection) => void
  children: ReactNode
}) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const navigateTo = (section: StaffSection) => {
    onSectionChange(section)
    setMenuOpen(false)
  }

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <aside className="hidden w-72 shrink-0 border-r border-gray-100 bg-white lg:flex lg:flex-col">
        <StaffSideNav
          activeSection={activeSection}
          onSelect={navigateTo}
          onLogout={() => void handleLogout()}
          userName={user?.name}
        />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[85%] max-w-xs gap-0 border-r p-0 [&>button]:hidden">
          <StaffSideNav
            activeSection={activeSection}
            onSelect={navigateTo}
            onLogout={() => void handleLogout()}
            userName={user?.name}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-gray-100 bg-white">
          <div className="flex h-14 items-center justify-between px-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-[#2D5A57] hover:bg-[#C5DDD9]/40 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden w-10 lg:block" />

            <div className="flex flex-col items-center">
              <div
                className="mb-0.5 flex h-7 w-7 items-center justify-center rounded-full"
                style={{ backgroundColor: COTY_HEADER }}
              >
                <Coffee className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="font-serif text-base font-bold leading-tight text-foreground">Coty Cafe</p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => void handleLogout()}
              aria-label="Cerrar sesión"
              className="text-[#2D5A57] hover:bg-[#C5DDD9]/40"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-5">{children}</main>
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
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
    </div>
  )
}
