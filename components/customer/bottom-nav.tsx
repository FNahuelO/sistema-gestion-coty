'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { COTY_HEADER } from '@/lib/coty-theme'

const NAV_ITEMS = [
  { href: '/', label: 'Inicio', icon: '/icons/inicio.svg', match: (path: string) => path === '/' },
  {
    href: '/menu',
    label: 'Menú',
    icon: '/icons/menu.svg',
    match: (path: string, search: URLSearchParams) =>
      path.startsWith('/menu') && !search.has('promo'),
  },
  { href: '/checkout', label: 'Pedidos', icon: '/icons/pedidos.svg', match: (path: string) => path.startsWith('/checkout') },
  {
    href: '/menu?promo=1',
    label: 'Promos',
    icon: '/icons/promo.svg',
    match: (path: string, search: URLSearchParams) =>
      path.startsWith('/menu') && search.has('promo'),
  },
  { href: '/order-status', label: 'Perfil', icon: '/icons/perfil.svg', match: (path: string) => path.startsWith('/order-status') },
] as const

export function CustomerBottomNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/6 bg-white safe-area-inset-bottom md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 pb-2 pt-2">
        {NAV_ITEMS.map(({ href, label, icon, match }) => {
          const isActive = match(pathname, searchParams)

          return (
            <a
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-1 no-underline relative"
            >
              <div className="flex flex-col items-center">
                <img
                  src={icon}
                  alt=""
                  aria-hidden
                  className={cn('h-5 w-5', isActive ? 'opacity-100' : 'opacity-50')}
                  style={
                    isActive
                      ? {
                          filter:
                            'brightness(0) saturate(100%) invert(12%) sepia(28%) saturate(1200%) hue-rotate(125deg) brightness(95%)',
                        }
                      : undefined
                  }
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  isActive ? 'font-semibold' : 'text-[#9BB8B5]',
                )}
                style={isActive ? { color: COTY_HEADER } : undefined}
              >
                {label}
              </span>
              {isActive && (
                <span
                  className="absolute -bottom-0.5 h-1 w-10 rounded-full"
                  style={{ backgroundColor: COTY_HEADER }}
                />
              )}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
