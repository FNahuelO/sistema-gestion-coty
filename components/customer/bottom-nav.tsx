'use client'

import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  UtensilsCrossed,
  ShoppingCart,
  Ticket,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { COTY_TEAL } from '@/lib/coty-theme'

const NAV_ITEMS = [
  { href: '/', label: 'Inicio', icon: LayoutGrid, match: (path: string) => path === '/' },
  { href: '/menu', label: 'Menú', icon: UtensilsCrossed, match: (path: string) => path.startsWith('/menu') },
  { href: '/checkout', label: 'Pedidos', icon: ShoppingCart, match: (path: string) => path.startsWith('/checkout') },
  { href: '/menu?promo', label: 'Promos', icon: Ticket, match: () => false },
  { href: '/order-status', label: 'Perfil', icon: User, match: (path: string) => path.startsWith('/order-status') },
] as const

export function CustomerBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/6 bg-white safe-area-inset-bottom"
    >
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 pb-2 pt-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const isActive = match(pathname)

          return (
            <a
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-1 no-underline"
            >
              <div className="relative flex flex-col items-center">
                {isActive && (
                  <span
                    className="absolute -top-1 h-0.5 w-5 rounded-full"
                    style={{ backgroundColor: COTY_TEAL }}
                  />
                )}
                <Icon
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-[#2D5A57]' : 'text-[#9BB8B5]',
                  )}
                  strokeWidth={1.75}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  isActive ? 'text-[#2D5A57]' : 'text-[#9BB8B5]',
                )}
              >
                {label}
              </span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
