'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Coffee,
  Wine,
  Sandwich,
  Soup,
  Beef,
  UtensilsCrossed,
  Utensils,
  Star,
  Clock,
  MapPin,
  Phone,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import { useBusiness, useCart, useCatalog } from '@/lib/store'
import type { CartItem, Product } from '@/lib/types'
import { COTY_TEAL, formatPrice, LOGO_SRC_SVG, LOGO_SRC_SVG_2, LOGO_SRC_SVG_NEGRO } from '@/lib/coty-theme'
import {
  LandingCarouselSkeleton,
  LandingFooterSkeleton,
  LoadingSkeleton,
} from '@/components/shared/loading'
const HERO_IMAGE = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=999&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
const CTA_IMAGE = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1600&h=500&fit=crop'
const PROMO_IMAGE = 'https://images.unsplash.com/photo-1436076865539-06670f77990b?w=1600&h=400&fit=crop'

const LANDING_CATEGORIES = [
  { name: 'Cafetería', slug: 'coffee', icon: Coffee },
  { name: 'Tragos y Milkshakes', slug: 'cold', icon: Wine },
  { name: 'Sándwiches', slug: 'sandwiches', icon: Sandwich },
  { name: 'Entradas', slug: 'starters', icon: Soup },
  { name: 'Hamburguesas', slug: 'burgers', icon: Beef },
  { name: 'Milanesas', slug: 'milanesas', icon: UtensilsCrossed },
  { name: 'Pastas', slug: 'burgers', icon: Utensils },
  { name: 'Promociones', slug: 'promo', icon: Star },
] as const

function getDefaultCartItem(items: CartItem[], productId: string) {
  return items.find(
    (item) => item.product.id === productId && item.selectedOptions.length === 0 && !item.notes
  )
}

function CotyLogo({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClass =
    size === 'sm'
      ? 'h-14 w-auto md:h-16'
      : size === 'lg'
        ? 'h-36 w-auto md:h-44'
        : 'h-20 w-auto md:h-24'

  return (
    <img
      src={LOGO_SRC_SVG}
      alt="Coty Café"
      className={`w-auto h-full object-contain ${sizeClass} ${className}`}
    />
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
        className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40 md:h-9 md:w-9"
        style={{ backgroundColor: COTY_TEAL }}
        aria-label="Quitar"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="relative mx-1 flex min-w-[72px] items-center justify-center md:min-w-[80px]">
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
        className="flex h-8 w-8 items-center justify-center rounded-full text-white md:h-9 md:w-9"
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
    return (
      <LandingCarouselSkeleton variant={navVariant === 'on-teal' ? 'on-teal' : 'default'} />
    )
  }
  if (products.length === 0) return null

  const navClass =
    navVariant === 'on-teal'
      ? 'border-white/40 bg-white/95 text-[#2D5A57] shadow-md hover:bg-white disabled:opacity-30'
      : 'border-[#2D5A57]/20 bg-white text-[#2D5A57] shadow-md hover:bg-white disabled:opacity-30'

  return (
    <Carousel opts={{ align: 'start', loop: false }} className="relative w-full px-7 md:px-9">
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
            className={cn(
              'top-1/2 left-0 h-9 w-9 -translate-y-1/2 md:-left-3',
              navClass,
            )}
          />
          <CarouselNext
            className={cn(
              'top-1/2 right-0 h-9 w-9 -translate-y-1/2 md:-right-3',
              navClass,
            )}
          />
        </>
      )}
    </Carousel>
  )
}

export function CustomerLanding() {
  const router = useRouter()
  const { settings, isLoading: isSettingsLoading } = useBusiness()
  const { items, itemCount, addItem, updateQuantity } = useCart()
  const { products, promotions, isLoading: isCatalogLoading } = useCatalog()
  const [searchQuery, setSearchQuery] = useState('')

  const featuredProducts = products.filter((product) => product.featured && product.available)
  const availableProducts = products.filter((product) => product.available)
  const carouselProducts = (featuredProducts.length > 0 ? featuredProducts : availableProducts).slice(0, 12)
  const activePromo = promotions.find((promo) => promo.active)

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/menu?search=${encodeURIComponent(searchQuery.trim())}`)
      return
    }
    router.push('/menu')
  }

  const whatsappUrl = settings.whatsapp
    ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`
    : '#'
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(settings.address)}`

  return (
    <div className="coly-landing min-h-screen bg-[#FDFBF9] pb-24">
      {/* Header + Hero */}
      <header
        className="rounded-b-4xl md:rounded-b-[2.5rem]"
        style={{ backgroundColor: COTY_TEAL }}
      >
        <div className="mx-auto max-w-6xl px-4 pb-5 pt-6 md:px-8 md:pb-8 md:pt-8">
          <div className="mb-4 flex flex-col gap-4 md:mb-6 md:flex-row md:items-center md:gap-8">
            <Link href="/" className="flex shrink-0 justify-center md:justify-start">
              <CotyLogo size="md" className="mix-blend-screen" />
            </Link>

            <form onSubmit={handleSearch} className="flex-1 md:max-w-xl md:mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 md:h-5 md:w-5" />
                <input
                  type="search"
                  placeholder="Buscar"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-full bg-white py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-gray-400 focus:outline-none md:py-3.5 md:pl-12 md:text-base"
                />
              </div>
            </form>

            <div className="hidden shrink-0 items-center gap-3 md:flex">
              <Link
                href="/menu"
                className="text-sm font-medium text-white/85 transition-colors hover:text-white"
              >
                Menú
              </Link>
              <Link
                href="/menu"
                className="relative flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25"
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

          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl">
            <img
              src={HERO_IMAGE}
              alt="Especialidad del local"
              className="h-40 w-full object-cover md:h-72 lg:h-80"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="flex h-48 w-48 items-center justify-center rounded-full p-2 shadow-lg md:h-36 md:w-36 md:p-3">
                <img
                  src={LOGO_SRC_SVG_2}
                  alt="Especialidad del local"
                  className="w-auto h-full object-contain md:h-72 lg:h-80"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 md:px-8">
        {/* Categories */}
        <section className="py-6 md:py-10">
          <h2 className="mb-4 text-lg font-bold md:mb-6 md:text-2xl">Categories</h2>
          <div className="grid grid-cols-4 gap-3 md:grid-cols-8 md:gap-4 lg:gap-6">
            {LANDING_CATEGORIES.map((category) => {
              const Icon = category.icon
              const href =
                category.slug === 'promo'
                  ? '/menu'
                  : `/menu?category=${category.slug}`

              return (
                <Link
                  key={category.name}
                  href={href}
                  className="group flex flex-col items-center gap-2 transition-transform hover:-translate-y-0.5"
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl transition-shadow group-hover:shadow-md md:h-16 md:w-16 md:rounded-2xl lg:h-[4.5rem] lg:w-[4.5rem]"
                    style={{ backgroundColor: COTY_TEAL }}
                  >
                    <Icon className="h-6 w-6 text-[#7EC8C4] md:h-7 md:w-7" strokeWidth={1.75} />
                  </div>
                  <span className="text-center text-[10px] font-medium leading-tight md:text-xs lg:text-sm">
                    {category.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Mas vendidos */}
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
          <div className="relative overflow-hidden rounded-2xl bg-black md:rounded-3xl">
            <img
              src={activePromo?.image ?? PROMO_IMAGE}
              alt={activePromo?.title ?? 'Promoción'}
              className="h-28 w-full object-cover opacity-60 md:h-40 lg:h-48"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 px-4">
              <p className="coly-promo-outline text-center text-3xl font-black uppercase leading-none md:text-5xl lg:text-6xl">
                {activePromo?.title?.toUpperCase() ?? '2X1 EN PINTAS'}
              </p>
            </div>
          </div>
          )}
        </section>
      </main>

      {/* Combos del día — full bleed teal */}
      <section className="pb-6 md:pb-10">
        <div
          className="rounded-tr-[3rem] md:rounded-tr-[4rem]"
          style={{ backgroundColor: COTY_TEAL }}
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

      <main className="mx-auto max-w-6xl px-4 md:px-8">
        {/* CTA */}
        <section className="pb-6 md:pb-10">
          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl">
            <img
              src={CTA_IMAGE}
              alt="Hacé tu pedido"
              className="h-28 w-full object-cover md:h-40 lg:h-48"
            />
            <div className="absolute inset-0 flex items-center justify-between bg-black/45 px-4 md:px-8 lg:px-12">
              <img
                src={LOGO_SRC_SVG}
                alt="Especialidad del local"
                className="w-24 mx-auto h-full object-contain md:h-72 lg:h-80"
              />
              <Link
                href="/menu"
                className="flex items-center gap-2 rounded-full bg-linear-to-r from-[#00C9B7] to-[#00E5D0] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 md:px-8 md:py-3.5 md:text-base"
              >
                Hace tu pedido
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Info footer — full bleed cream */}
      <section className="bg-[#F5F0EA] py-8 w-[90%] mx-auto rounded-2xl md:rounded-3xl md:py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          {isSettingsLoading ? (
            <LandingFooterSkeleton />
          ) : (
          <div className="grid grid-cols-3 gap-2 md:gap-8 lg:gap-12">
            <div className="flex flex-col items-center text-center border-r-1 border-[#EAE4E0]">
              <Clock className="mb-2 h-5 w-5 md:mb-3 md:h-6 md:w-6" style={{ color: COTY_TEAL }} />
              <p className="text-[11px] font-semibold md:text-sm">Horarios</p>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground md:mt-2 md:text-sm">
                Lun a Sáb {settings.openTime} - {settings.closeTime} hs
              </p>
              <span
                className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium md:mt-3 md:px-3 md:py-1 md:text-xs ${settings.isOpen
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
                  }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full md:h-2 md:w-2 ${settings.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                {settings.isOpen ? 'Abierto ahora' : 'Cerrado'}
              </span>
            </div>

            <div className="flex flex-col items-center text-center ">
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

            <div className="flex flex-col items-center text-center border-l-1 border-[#EAE4E0]">
              <Phone className="mb-2 h-5 w-5 md:mb-3 md:h-6 md:w-6" style={{ color: COTY_TEAL }} />
              <p className="text-[11px] font-semibold md:text-sm">Contacto</p>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground md:mt-2 md:text-sm">
                {settings.phone}
                {settings.instagram ? ` ${settings.instagram}` : ''}
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 rounded-full border border-[#2D5A57]/20 bg-white px-2 py-0.5 text-[9px] font-medium text-[#2D5A57] transition-colors hover:bg-[#2D5A57]/5 md:mt-3 md:px-4 md:py-1.5 md:text-xs"
              >
                WhatsApp
              </a>
            </div>
          </div>
          )}
        </div>
      </section>

      {/* Final footer */}
      <footer className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-10 pt-6 md:px-8 md:pb-14 md:pt-10">
        <img
          src={LOGO_SRC_SVG_NEGRO}
          alt="Coty Café"
          className="w-auto h-full object-contain md:h-72 lg:h-80 text-white"
        />
        <p className="mt-4 text-center text-[10px] text-muted-foreground md:text-xs">
          Coty Café - Resto Bar. Todos los derechos reservados.
        </p>
      </footer>

      {/* Floating cart — mobile centered, desktop bottom-right */}
      {itemCount > 0 && (
        <div className="fixed bottom-[72px] left-1/2 z-50 w-full max-w-[390px] -translate-x-1/2 px-4 md:left-auto md:right-8 md:max-w-sm md:translate-x-0 lg:right-12">
          <Link
            href="/checkout"
            className="flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white shadow-xl transition-transform hover:scale-[1.02] md:py-4 md:text-base"
            style={{ backgroundColor: COTY_TEAL }}
          >
            <ShoppingBag className="h-4 w-4 md:h-5 md:w-5" />
            Ver pedido ({itemCount})
          </Link>
        </div>
      )}
    </div>
  )
}
