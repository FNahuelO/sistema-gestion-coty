'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Coffee, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { COTY_HEADER } from '@/lib/coty-theme'
import { useAuth } from '@/lib/store'
import { AdminSideNav } from './ui/admin-side-nav'
import { AdminMobileNav, getAdminSectionLabel } from './ui/admin-mobile-nav'
import { MobileShellPadding } from './ui/mobile-shell-padding'
import type { AdminSection } from './types'
import type { SessionRoleContext } from '@/lib/permissions'

export function AdminShell({
  activeSection,
  onSectionChange,
  roleContext,
  children,
}: {
  activeSection: AdminSection
  onSectionChange: (section: AdminSection) => void
  roleContext: SessionRoleContext
  children: ReactNode
}) {
  const router = useRouter()
  const { logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const navigateTo = (section: AdminSection) => {
    onSectionChange(section)
    setMenuOpen(false)
  }

  const sectionLabel = getAdminSectionLabel(activeSection)

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <aside className="hidden w-72 shrink-0 border-r border-gray-100 bg-white lg:flex lg:flex-col">
        <AdminSideNav
          activeSection={activeSection}
          onSelect={navigateTo}
          onLogout={() => void handleLogout()}
          roleContext={roleContext}
        />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[85%] max-w-xs gap-0 border-r p-0 [&>button]:hidden">
          <AdminSideNav
            activeSection={activeSection}
            onSelect={navigateTo}
            onLogout={() => void handleLogout()}
            roleContext={roleContext}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0 text-[#2D5A57] hover:bg-[#C5DDD9]/40 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden w-10 lg:block" />

            <div className="min-w-0 flex-1 text-center lg:flex lg:flex-none lg:flex-col lg:items-center">
              <div className="hidden lg:flex lg:flex-col lg:items-center">
                <div
                  className="mb-0.5 flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ backgroundColor: COTY_HEADER }}
                >
                  <Coffee className="h-3.5 w-3.5 text-white" />
                </div>
                <p className="font-serif text-base font-bold leading-tight text-foreground">Coty Cafe</p>
              </div>
              <div className="lg:hidden">
                <p className="truncate font-serif text-base font-bold text-foreground">{sectionLabel}</p>
                <p className="truncate text-[10px] text-muted-foreground">Coty Cafe · Admin</p>
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

        <AdminMobileNav
          activeSection={activeSection}
          onSelect={navigateTo}
          onOpenMore={() => setMenuOpen(true)}
          roleContext={roleContext}
        />
      </div>
    </div>
  )
}
