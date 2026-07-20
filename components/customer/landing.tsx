'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  Star,
  Rocket,
  Armchair,
  Clock,
  MapPin,
  Phone,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Lock,
} from 'lucide-react'
import { getCategoryIcon } from '@/lib/category-icons'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { getActivePromotions } from '@/lib/promotions'
import { buildMenuPathWithTable, MESA_QUERY_PARAM, getMesaIdFromSearch } from '@/lib/menu-url'
import { cn } from '@/lib/utils'
import { useBusiness, useCart, useCatalog, useTableSession } from '@/lib/store'
import type { CartItem, Product } from '@/lib/types'
import {
  COTY_COMBOS_GRADIENT,
  COTY_CTA_GRADIENT,
  COTY_HEADER,
  COTY_MINT,
  COTY_PAGE_BG,
  COTY_TEAL,
  formatPrice,
  LOGO_SRC_SVG,
  LOGO_SRC_SVG_NEGRO,
} from '@/lib/coty-theme'
import { LandingCarouselSkeleton, LandingCategoryGridSkeleton, LandingFooterSkeleton, LoadingSkeleton } from '@/components/shared/loading'
import { PromotionBanner } from '@/components/customer/promotion-banner'
import { InstallAppPrompt } from '@/components/customer/install-app-prompt'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=999&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
const CTA_IMAGE = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1600&h=500&fit=crop'

function getDefaultCartItem(items: CartItem[], productId: string) {
  return items.find(
    (item) => item.product.id === productId && item.selectedOptions.length === 0 && !item.notes
  )
}

function TablePill() {
  const searchParams = useSearchParams()
  const { tableSession, isLoading } = useTableSession()
  const mesaFromUrl = getMesaIdFromSearch(searchParams)

  if (isLoading) {
    return (
      <div
        className="absolute right-4 top-6 z-20 h-7 w-20 animate-pulse rounded-full bg-white/20"
        aria-hidden
      />
    )
  }

  if (!mesaFromUrl || !tableSession) return null

  return (
    <div
      className="absolute right-4 top-6 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 shadow-sm"
      style={{ backgroundColor: COTY_MINT }}
    >
      <Armchair className="h-3.5 w-3.5" style={{ color: COTY_HEADER }} strokeWidth={2} />
      <span className="text-xs font-semibold" style={{ color: COTY_HEADER }}>
        Mesa {tableSession.tableNumber}
      </span>
    </div>
  )
}

function buildLandingMenuHref(tableId: string | undefined, params?: Record<string, string>) {
  const search = new URLSearchParams()
  if (tableId) search.set(MESA_QUERY_PARAM, tableId)
  if (params) {
    Object.entries(params).forEach(([key, value]) => search.set(key, value))
  }
  const query = search.toString()
  return query ? `/menu?${query}` : '/menu'
}

function ClocheIllustration() {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-16 w-16 shrink-0"
      aria-hidden
    >
      <path d="M12 48h48" stroke={COTY_HEADER} strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="36" cy="48" rx="24" ry="4" stroke={COTY_HEADER} strokeWidth="1.5" />
      <path
        d="M18 48c0-14 8-26 18-26s18 12 18 26"
        stroke={COTY_HEADER}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="36" cy="20" r="2" fill={COTY_TEAL} />
      <path
        d="M28 14l1.5 2M44 14l-1.5 2M22 24l2 1M50 24l-2 1"
        stroke={COTY_TEAL}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function HeroCard({ subtitle, menuHref = '/menu' }: { subtitle: string; menuHref?: string }) {
  return (
    <div className="overflow-visible rounded-2xl shadow-lg md:rounded-3xl">
      <div className="flex min-h-38 overflow-hidden rounded-2xl md:min-h-44 md:rounded-3xl">
        <div
          className="flex w-[58%] shrink-0 flex-col justify-center gap-2.5 px-4 py-5 md:w-[55%] md:gap-3 md:px-6 md:py-6"
          style={{ backgroundColor: COTY_HEADER }}
        >
          <h2 className="text-base font-bold leading-snug text-white md:text-xl">
            ¡Tu próximo favorito te está esperando!
          </h2>
          <p className="text-[11px] leading-snug text-white/80 md:text-sm">{subtitle}</p>
          <Link
            href={menuHref}
            className="mt-1 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-90 md:px-5 md:py-2.5 md:text-sm"
            style={{ backgroundColor: COTY_MINT, color: COTY_HEADER }}
          >
            <Rocket className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Empezar pedido
          </Link>
        </div>
        <div className="relative flex-1 overflow-visible" style={{ backgroundColor: COTY_PAGE_BG }}>
          <img
            src={HERO_IMAGE}
            alt="Especialidad del local"
            className="absolute -right-3 top-1/2 h-[118%] w-[118%] max-w-none -translate-y-1/2 object-cover object-center md:-right-5"
          />
        </div>
      </div>
    </div>
  )
}

function QuantityControl({
  quantity,
  onIncrease,
  onDecrease,
  quantityBg = 'white',
}: {
  quantity: number
  onIncrease: () => void
  onDecrease: () => void
  quantityBg?: 'white' | 'white/95'
}) {
  return (
    <div className="flex items-center justify-center gap-0 pt-1 md:pt-2">
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity === 0}
        className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40 md:h-9 md:w-9"
        style={{ backgroundColor: COTY_TEAL }}
        aria-label="Quitar"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="relative mx-1 flex min-w-[52px] items-center justify-center md:min-w-[60px]">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#2D5A57]/30" />
        <span
          className={`relative px-2 text-sm font-medium text-foreground md:text-base ${quantityBg === 'white/95' ? 'bg-white/95' : 'bg-white'
            }`}
        >
          {quantity || ''}
        </span>
      </div>
      <button
        type="button"
        onClick={onIncrease}
        className="flex h-9 w-9 items-center justify-center rounded-full text-white md:h-9 md:w-9"
        style={{ backgroundColor: COTY_TEAL }}
        aria-label="Agregar"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

function ProductCard({
  product,
  items,
  addItem,
  updateQuantity,
  cardBg = 'white',
}: {
  product: Product
  items: CartItem[]
  addItem: ReturnType<typeof useCart>['addItem']
  updateQuantity: ReturnType<typeof useCart>['updateQuantity']
  cardBg?: 'white' | 'transparent'
}) {
  const cartItem = getDefaultCartItem(items, product.id)
  const quantity = cartItem?.quantity ?? 0
  const hasRequiredOptions = product.options?.some((option) => option.required)

  const handleIncrease = () => {
    if (hasRequiredOptions) {
      window.location.href = `/menu?product=${product.id}`
      return
    }
    if (cartItem) {
      updateQuantity(cartItem.id, cartItem.quantity + 1)
      return
    }
    addItem(product, 1, [])
  }

  const handleDecrease = () => {
    if (cartItem) {
      updateQuantity(cartItem.id, cartItem.quantity - 1)
    }
  }

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-black/8 shadow-sm md:rounded-3xl ${cardBg === 'white' ? 'bg-white' : 'bg-white/95'
        }`}
    >
      <div className="aspect-4/3 shrink-0 overflow-hidden">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col p-3 md:p-4">
        <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-tight md:min-h-11 md:text-base">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 min-h-8 text-[11px] leading-snug text-muted-foreground md:min-h-9 md:text-xs">
          {product.description}
        </p>
        <p className="mt-2 text-sm font-bold md:text-base">{formatPrice(product.price)}</p>
        <div className="mt-auto pt-2">
          <QuantityControl
            quantity={quantity}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            quantityBg={cardBg === 'transparent' ? 'white/95' : 'white'}
          />
        </div>
      </div>
    </div>
  )
}

function ProductCarousel({
  products,
  items,
  addItem,
  updateQuantity,
  cardBg = 'white',
  navVariant = 'default',
  isLoading = false,
}: {
  products: Product[]
  items: CartItem[]
  addItem: ReturnType<typeof useCart>['addItem']
  updateQuantity: ReturnType<typeof useCart>['updateQuantity']
  cardBg?: 'white' | 'transparent'
  navVariant?: 'default' | 'on-teal'
  isLoading?: boolean
}) {
  if (isLoading) {
    return <LandingCarouselSkeleton variant={navVariant === 'on-teal' ? 'on-teal' : 'default'} />
  }
  if (products.length === 0) return null

  const navClass =
    navVariant === 'on-teal'
      ? 'border-white/40 bg-white/95 text-[#2D5A57] shadow-md hover:bg-white disabled:opacity-30'
      : 'border-[#2D5A57]/20 bg-white text-[#2D5A57] shadow-md hover:bg-white disabled:opacity-30'

  return (
    <Carousel opts={{ align: 'start', loop: false }} className="relative w-full px-7 md:px-0 lg:px-2">
      <CarouselContent className="-ml-3 items-stretch md:-ml-4">
        {products.map((product) => (
          <CarouselItem
            key={product.id}
            className="flex basis-[calc(50%-0.375rem)] pl-3 md:basis-[calc(33.333%-0.75rem)] md:pl-4 lg:basis-[calc(25%-0.75rem)]"
          >
            <ProductCard
              product={product}
              items={items}
              addItem={addItem}
              updateQuantity={updateQuantity}
              cardBg={cardBg}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      {products.length > 2 && (
        <>
          <CarouselPrevious
            className={cn('top-1/2 left-0 h-9 w-9 -translate-y-1/2 md:-left-3', navClass)}
          />
          <CarouselNext
            className={cn('top-1/2 right-0 h-9 w-9 -translate-y-1/2 md:-right-3', navClass)}
          />
        </>
      )}
    </Carousel>
  )
}

export function CustomerLanding() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings, isLoading: isSettingsLoading } = useBusiness()
  const { items, itemCount, hydrated: cartHydrated, addItem, updateQuantity } = useCart()
  const { products, categories, promotions, channelAvailability, isLoading: isCatalogLoading } =
    useCatalog()
  const { tableSession } = useTableSession()
  const [searchQuery, setSearchQuery] = useState('')
  const mesaFromUrl = getMesaIdFromSearch(searchParams)
  const menuHref = mesaFromUrl ? buildMenuPathWithTable(mesaFromUrl) : '/menu'
  const tableContextId = mesaFromUrl ?? undefined

  const landingCategories = [
    ...categories
      .filter((category) => category.active !== false)
      .sort((left, right) => left.order - right.order)
      .slice(0, 7)
      .map((category) => ({
        name: category.name,
        href: buildLandingMenuHref(tableContextId, { category: category.id }),
        icon: getCategoryIcon(category.icon),
      })),
    { name: 'Promos', href: buildLandingMenuHref(tableContextId, { promo: '1' }), icon: Star },
  ]

  const featuredProducts = products.filter((product) => product.featured && product.available)
  const availableProducts = products.filter((product) => product.available)
  const carouselProducts = (featuredProducts.length > 0 ? featuredProducts : availableProducts).slice(
    0,
    12
  )
  const activePromo = getActivePromotions(promotions)[0]

  const heroSubtitle = tableContextId
    ? 'Explorá nuestro menú y pedí en tu mesa.'
    : 'Explorá nuestro menú y pedí para retirar o delivery.'

  const infoCardDescription = tableContextId
    ? 'Elegí lo que más te guste, nosotros lo llevamos a tu mesa.'
    : 'Elegí lo que más te guste, retiralo en el local o pedí delivery.'

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    if (searchQuery.trim()) {
      router.push(buildLandingMenuHref(tableContextId, { search: searchQuery.trim() }))
      return
    }
    router.push(menuHref)
  }

  const whatsappUrl = settings.whatsapp
    ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`
    : '#'
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(settings.address)}`
  const instagramUrl = settings.instagram
    ? settings.instagram.startsWith('http')
      ? settings.instagram
      : `https://instagram.com/${settings.instagram.replace(/^@/, '')}`
    : null
  const facebookUrl = settings.facebook
    ? settings.facebook.startsWith('http')
      ? settings.facebook
      : `https://facebook.com/${settings.facebook.replace(/^@/, '')}`
    : null

  return (
    <div className="coly-landing min-h-screen pb-24 md:pb-10" style={{ backgroundColor: COTY_PAGE_BG }}>
      {/* Header móvil — verde con hero solapado como mockup */}
      <div
        className="relative mb-14 w-full rounded-b-4xl md:hidden"
        style={{ backgroundColor: COTY_HEADER }}
      >
        <div className="relative mx-auto w-full max-w-lg px-4">
          <header className="relative pb-28 pt-6">
            <TablePill />

            <Link href="/" className="flex justify-center">
              <img
                src={LOGO_SRC_SVG}
                alt="Coty Café"
                className="h-16 w-auto object-contain mix-blend-screen"
              />
            </Link>

            <p className="mt-3 text-center text-sm text-white">¡Hola! ¿Qué vas a pedir hoy?</p>

            <form onSubmit={handleSearch} className="mt-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-full bg-white py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </form>
          </header>

          <div className="absolute inset-x-0 z-10 -mt-[6.5rem] px-4">
            <HeroCard subtitle={heroSubtitle} menuHref={menuHref} />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg px-4 md:max-w-6xl md:px-8 lg:px-10">
        {/* Hero card — desktop */}
        <div className="relative z-10 hidden md:mt-8 md:block">
          <HeroCard subtitle={heroSubtitle} menuHref={menuHref} />
        </div>

        {/* Categorías — diseño mockup */}
        <section className="py-6 md:py-10">
          <h2 className="mb-4 text-lg font-bold text-[#1A1A1A] md:mb-6 md:text-2xl">Categorías</h2>
          {isCatalogLoading && categories.length === 0 ? (
            <LandingCategoryGridSkeleton />
          ) : (
            <div className="grid grid-cols-4 gap-3 md:grid-cols-8 md:gap-4 lg:gap-6">
              {landingCategories.map((category) => {
                const Icon = category.icon

                return (
                  <Link
                    key={category.href}
                    href={category.href}
                    className="group flex flex-col items-center gap-2 transition-transform hover:-translate-y-0.5"
                  >
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-xl transition-shadow group-hover:shadow-md md:h-16 md:w-16 md:rounded-2xl lg:h-[4.5rem] lg:w-[4.5rem]"
                      style={{ backgroundColor: COTY_HEADER }}
                    >
                      <Icon className="h-6 w-6 text-[#6baca5] md:h-7 md:w-7" strokeWidth={1.75} />
                    </div>
                    <span className="text-center text-[10px] font-medium leading-tight text-[#1A1A1A] md:text-xs lg:text-sm">
                      {category.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Info card — diseño mockup */}
        <section className="pb-6 md:pb-8">
          <div className="flex items-center gap-4 rounded-2xl border border-[#E8E4DF] bg-[#FAFAF8] px-4 py-5 md:gap-6 md:rounded-3xl md:px-6 md:py-6">
            <ClocheIllustration />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#1A1A1A] md:text-base">Pedir es fácil y rápido</h3>
              <p className="mt-1 text-xs leading-snug text-muted-foreground md:text-sm">
                {infoCardDescription}
              </p>
            </div>
          </div>
        </section>

        {/* Más vendidos */}
        <section className="pb-6 md:pb-10">
          <h2 className="mb-4 text-lg font-bold md:mb-6 md:text-2xl">Mas vendidos</h2>
          <ProductCarousel
            products={carouselProducts}
            items={items}
            addItem={addItem}
            updateQuantity={updateQuantity}
            isLoading={isCatalogLoading}
          />
        </section>

        {/* Promo banner */}
        <section className="pb-6 md:pb-10">
          {isCatalogLoading ? (
            <LoadingSkeleton className="h-28 w-full rounded-2xl md:h-40 lg:h-48" />
          ) : (
            <Link href="/menu?promo=1" className="block">
              <PromotionBanner
                variant="hero"
                title={activePromo?.title?.toUpperCase() ?? '2X1 EN PINTAS'}
                image={activePromo?.image}
              />
            </Link>
          )}
        </section>
      </div>

      {/* Combos del día */}
      <section className="pb-6 md:pb-10">
        <div
          className="rounded-tr-[3rem] md:rounded-tr-[4rem]"
          style={{ background: COTY_COMBOS_GRADIENT }}
        >
          <div className="mx-auto max-w-6xl px-4 pb-6 pt-5 md:px-8 md:pb-10 md:pt-8">
            <h2 className="mb-4 text-lg font-bold text-white md:mb-6 md:text-2xl">Combos del día</h2>
            <ProductCarousel
              products={carouselProducts}
              items={items}
              addItem={addItem}
              updateQuantity={updateQuantity}
              cardBg="transparent"
              navVariant="on-teal"
              isLoading={isCatalogLoading}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 md:px-8">
        {/* CTA */}
        <section className="pb-6 md:pb-10">
          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl">
            <img
              src={CTA_IMAGE}
              alt="Hacé tu pedido"
              className="h-28 w-full object-cover md:h-40 lg:h-48"
            />
            <div className="absolute inset-0 flex items-center justify-around gap-4 bg-black/45 px-4 md:px-8 lg:px-12">
              <img
                src={LOGO_SRC_SVG}
                alt="Coty Café"
                className="h-12 w-auto object-contain mix-blend-screen md:h-14"
              />
              <Link
                href="/menu"
                className="flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 md:px-8 md:py-3.5 md:text-base"
                style={{ background: COTY_CTA_GRADIENT }}
              >
                Hace tu pedido
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Footer horarios / contacto */}
      <section className="mx-auto w-[92%] max-w-6xl rounded-2xl bg-[#F5F0EA] py-8 md:w-full md:rounded-3xl md:py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          {isSettingsLoading ? (
            <LandingFooterSkeleton />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-8 lg:gap-12">
              <div className="flex flex-col items-center border-r-1 border-[#EAE4E0] text-center">
                <Clock className="mb-2 h-5 w-5 md:mb-3 md:h-6 md:w-6" style={{ color: COTY_TEAL }} />
                <p className="text-[11px] font-semibold md:text-sm">Horarios</p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground md:mt-2 md:text-sm">
                  Lun a Sáb {settings.openTime} - {settings.closeTime} hs
                </p>
                <span
                  className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium md:mt-3 md:px-3 md:py-1 md:text-xs ${settings.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full md:h-2 md:w-2 ${settings.isOpen ? 'bg-green-500' : 'bg-red-500'
                      }`}
                  />
                  {settings.isOpen ? 'Abierto ahora' : 'Cerrado'}
                </span>
                {channelAvailability ? (
                  <div className="mt-2 flex flex-wrap justify-center gap-1">
                    {(['delivery', 'pickup'] as const).map((channel) => (
                      <span
                        key={channel}
                        className={`rounded-full px-2 py-0.5 text-[9px] ${channelAvailability[channel]?.open
                          ? 'bg-[#C5DDD9]/50 text-[#2D5A57]'
                          : 'bg-gray-100 text-muted-foreground'
                          }`}
                      >
                        {channel === 'delivery' ? 'Delivery' : 'Retiro'}:{' '}
                        {channelAvailability[channel]?.open ? 'Abierto' : 'Cerrado'}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col items-center text-center">
                <MapPin className="mb-2 h-5 w-5 md:mb-3 md:h-6 md:w-6" style={{ color: COTY_TEAL }} />
                <p className="text-[11px] font-semibold md:text-sm">Ubicación</p>
                <p className="mt-1 text-[10px] leading-snug text-muted-foreground md:mt-2 md:max-w-xs md:text-sm">
                  {settings.address}
                </p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 rounded-full border border-[#2D5A57]/20 bg-white px-2 py-0.5 text-[9px] font-medium text-[#2D5A57] transition-colors hover:bg-[#2D5A57]/5 md:mt-3 md:px-4 md:py-1.5 md:text-xs"
                >
                  Ver en el mapa
                </a>
              </div>

              <div className="flex flex-col items-center border-l-1 border-[#EAE4E0] text-center">
                <Phone className="mb-2 h-5 w-5 md:mb-3 md:h-6 md:w-6" style={{ color: COTY_TEAL }} />
                <p className="text-[11px] font-semibold md:text-sm">Contacto</p>
                <p className="mt-1 text-[10px] leading-snug text-muted-foreground md:mt-2 md:text-sm">
                  {settings.phone}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 md:mt-3">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-[#2D5A57]/20 bg-white px-2 py-0.5 text-[9px] font-medium text-[#2D5A57] transition-colors hover:bg-[#2D5A57]/5 md:px-4 md:py-1.5 md:text-xs"
                  >
                    WhatsApp
                  </a>
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-[#2D5A57]/20 bg-white px-2 py-0.5 text-[9px] font-medium text-[#2D5A57] transition-colors hover:bg-[#2D5A57]/5 md:px-4 md:py-1.5 md:text-xs"
                    >
                      Instagram
                    </a>
                  )}
                  {facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-[#2D5A57]/20 bg-white px-2 py-0.5 text-[9px] font-medium text-[#2D5A57] transition-colors hover:bg-[#2D5A57]/5 md:px-4 md:py-1.5 md:text-xs"
                    >
                      Facebook
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Instalar app (PWA) */}
      <div className="mt-6 md:mt-8">
        <InstallAppPrompt />
      </div>

      {/* Footer final */}
      <footer className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-10 pt-6 md:px-8 md:pb-14 md:pt-10">
        <img
          src={LOGO_SRC_SVG_NEGRO}
          alt={settings.name}
          className="h-16 w-auto object-contain md:h-24"
        />
        <p className="mt-4 text-center text-[10px] text-muted-foreground md:text-xs">
          {settings.name} © {new Date().getFullYear()}. Todos los derechos reservados.
        </p>
        <Link
          href="/login"
          className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[10px] font-medium text-muted-foreground/70 transition-colors hover:text-[#2D5A57] md:text-xs"
        >
          <Lock className="h-3 w-3" />
          Acceso personal
        </Link>
      </footer>

      {cartHydrated && itemCount > 0 ? (
        <div className="fixed bottom-[72px] left-1/2 z-50 w-full max-w-[390px] -translate-x-1/2 px-4 md:hidden">
          <Link
            href="/checkout"
            className="flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white shadow-xl transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: COTY_TEAL }}
          >
            <ShoppingBag className="h-4 w-4" />
            Ver pedido ({itemCount})
          </Link>
        </div>
      ) : null}
    </div>
  )
}
