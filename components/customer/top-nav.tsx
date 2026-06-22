'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ShoppingBag,
  Search,
  Instagram,
  Facebook,
  MessageSquare,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { COTY_HEADER, LOGO_SRC_SVG } from '@/lib/coty-theme'
import { useCart, useCatalog } from '@/lib/store'
import { buildFacebookUrl, buildInstagramUrl } from '@/lib/social-links'
import Image from 'next/image'

const NAV_ITEMS = [
  { href: '/', label: 'Inicio', icon: '/icons/inicio.svg', match: (path: string) => path === '/' },
  {
    href: '/menu',
    label: 'Menú',
    icon: '/icons/menu.svg',
    match: (path: string, search: URLSearchParams) => path.startsWith('/menu') && !search.has('promo'),
  },
  { href: '/checkout', label: 'Pedidos', icon: '/icons/pedidos.svg', match: (path: string) => path.startsWith('/checkout') },
  {
    href: '/menu?promo=1',
    label: 'Promos',
    icon: '/icons/promo.svg',
    match: (path: string, search: URLSearchParams) => path.startsWith('/menu') && search.has('promo'),
  },
  { href: '/order-status', label: 'Perfil', icon: '/icons/perfil.svg', match: (path: string) => path.startsWith('/order-status') },
] as const

function HomeSearchBar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/menu?search=${encodeURIComponent(searchQuery.trim())}`)
      return
    }
    router.push('/menu')
  }

  return (
    <form onSubmit={handleSearch} className="mx-auto w-full max-w-2xl pb-5">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Buscar"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-full bg-white py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-gray-400 focus:outline-none md:py-3.5 md:text-base"
        />
      </div>
    </form>
  )
}

export function CustomerTopNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { itemCount } = useCart()
  const { settings } = useCatalog()
  const isHome = pathname === '/'
  const instagramUrl = buildInstagramUrl(settings?.instagram)
  const facebookUrl = buildFacebookUrl(settings?.facebook)
  const whatsappUrl = settings?.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}` : null

  return (
    <header
      className={cn(
        'sticky top-0 z-50 hidden md:block',
        !isHome && 'border-b border-white/10',
      )}
      style={{ backgroundColor: COTY_HEADER }}
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex items-center gap-6 py-4 lg:gap-8">
          <Link href="/" className="shrink-0">
            <img
              src={LOGO_SRC_SVG}
              alt="Coty Café"
              className="h-12 w-auto object-contain mix-blend-screen lg:h-14"
            />
          </Link>

          <nav
            aria-label="Navegación principal"
            className="flex flex-1 items-center justify-center gap-1 lg:gap-2"
          >
            {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
              const isActive =
                match.length > 1
                  ? (match as (path: string, search: URLSearchParams) => boolean)(pathname, searchParams)
                  : (match as (path: string) => boolean)(pathname)

              return (
                <Link
                  key={`${href}-${label}`}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors lg:px-5',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/75 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <Image src={Icon} alt="" width={17} height={17} />
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {(instagramUrl || facebookUrl || whatsappUrl) && (
              <div className="hidden items-center gap-1 lg:flex">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full p-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="WhatsApp"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full p-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full p-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}

            <Link
              href="/checkout"
              className="relative flex shrink-0 items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/25"
            >
              <ShoppingBag className="h-4 w-4" />
              Carrito
              {itemCount > 0 && (
                <Badge className="h-5 min-w-5 rounded-full bg-[#00C9B7] px-1 text-[10px] text-white">
                  {itemCount}
                </Badge>
              )}
            </Link>
          </div>
        </div>

        {isHome && <HomeSearchBar />}
      </div>
    </header>
  )
}
