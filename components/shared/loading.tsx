'use client'

import { Coffee } from 'lucide-react'
import { MenuCategoryNavSkeleton } from '@/components/customer/menu-category-nav'
import { MenuProductCarouselSkeleton } from '@/components/customer/menu-product-carousel'
import {
  COTY_COMBOS_GRADIENT,
  COTY_CREAM,
  COTY_HEADER,
  COTY_PAGE_BG,
} from '@/lib/coty-theme'
import { cn } from '@/lib/utils'

export function LoadingScreen() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" style={{ backgroundColor: COTY_PAGE_BG }}>
      <div className="flex flex-col items-center gap-4">
        <Coffee className="h-10 w-10 animate-pulse text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Cargando...</p>
      </div>
    </div>
  )
}

function HeroCardSkeleton() {
  return (
    <div className="overflow-visible rounded-2xl shadow-lg md:rounded-3xl">
      <div className="flex min-h-38 overflow-hidden rounded-2xl md:min-h-44 md:rounded-3xl">
        <div
          className="flex w-[58%] shrink-0 flex-col justify-center gap-2.5 px-4 py-5 md:w-[55%] md:gap-3 md:px-6 md:py-6"
          style={{ backgroundColor: COTY_HEADER }}
        >
          <LoadingSkeleton className="h-5 w-4/5 !bg-white/20" />
          <LoadingSkeleton className="h-3 w-full !bg-white/15" />
          <LoadingSkeleton className="h-3 w-3/4 !bg-white/15" />
          <LoadingSkeleton className="mt-1 h-9 w-32 rounded-full !bg-white/25" />
        </div>
        <div className="relative flex-1" style={{ backgroundColor: COTY_PAGE_BG }}>
          <LoadingSkeleton className="absolute -right-3 top-1/2 h-[118%] w-[118%] max-w-none -translate-y-1/2 rounded-none md:-right-5" />
        </div>
      </div>
    </div>
  )
}

export function LandingCategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-3 md:grid-cols-8 md:gap-4 lg:gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex flex-col items-center gap-2">
          <LoadingSkeleton
            className="h-14 w-14 rounded-xl md:h-16 md:w-16 md:rounded-2xl"
            style={{ backgroundColor: `${COTY_HEADER}33` }}
          />
          <LoadingSkeleton className="h-3 w-10 rounded-md md:w-12" />
        </div>
      ))}
    </div>
  )
}

function MenuSectionsLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="space-y-4">
          <div className="flex items-center gap-3">
            <LoadingSkeleton className="h-12 w-12 shrink-0 rounded-2xl" />
            <div className="space-y-2">
              <LoadingSkeleton className="h-4 w-28" />
              <LoadingSkeleton className="h-3 w-20" />
            </div>
          </div>
          <MenuProductCarouselSkeleton count={3} />
        </div>
      ))}
    </div>
  )
}

export function CustomerLandingSkeleton() {
  return (
    <div
      className="coly-landing min-h-screen pb-24 md:pb-10"
      style={{ backgroundColor: COTY_PAGE_BG }}
      aria-busy="true"
      aria-label="Cargando inicio"
    >
      <div
        className="relative mb-14 w-full rounded-b-4xl md:hidden"
        style={{ backgroundColor: COTY_HEADER }}
      >
        <div className="relative mx-auto w-full max-w-lg px-4">
          <header className="relative pb-28 pt-6">
            <LoadingSkeleton className="mx-auto h-16 w-32 !bg-white/20" />
            <LoadingSkeleton className="mx-auto mt-3 h-4 w-48 !bg-white/15" />
            <LoadingSkeleton className="mt-4 h-11 w-full rounded-full !bg-white/90" />
          </header>
          <div className="absolute inset-x-0 z-10 -mt-[6.5rem] px-4">
            <HeroCardSkeleton />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg px-4 md:max-w-6xl md:px-8 lg:px-10">
        <div className="relative z-10 hidden md:mt-8 md:block">
          <HeroCardSkeleton />
        </div>

        <section className="py-6 md:py-10">
          <LoadingSkeleton className="mb-4 h-6 w-28 md:mb-6 md:h-8 md:w-36" />
          <LandingCategoryGridSkeleton />
        </section>

        <section className="pb-6 md:pb-8">
          <div className="flex items-center gap-4 rounded-2xl border border-[#E8E4DF] bg-[#FAFAF8] px-4 py-5 md:gap-6 md:rounded-3xl md:px-6 md:py-6">
            <LoadingSkeleton className="h-16 w-16 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <LoadingSkeleton className="h-4 w-40 md:h-5 md:w-48" />
              <LoadingSkeleton className="h-3 w-full" />
              <LoadingSkeleton className="h-3 w-4/5" />
            </div>
          </div>
        </section>

        <section className="pb-6 md:pb-10">
          <LoadingSkeleton className="mb-4 h-6 w-32 md:mb-6 md:h-8 md:w-40" />
          <LandingCarouselSkeleton />
        </section>

        <section className="pb-6 md:pb-10">
          <LoadingSkeleton className="h-28 w-full rounded-2xl md:h-40 lg:h-48" />
        </section>
      </div>

      <section className="pb-6 md:pb-10">
        <div
          className="rounded-tr-[3rem] md:rounded-tr-[4rem]"
          style={{ background: COTY_COMBOS_GRADIENT }}
        >
          <div className="mx-auto max-w-6xl px-4 pb-6 pt-5 md:px-8 md:pb-10 md:pt-8">
            <LoadingSkeleton className="mb-4 h-6 w-36 !bg-white/25 md:mb-6 md:h-8 md:w-44" />
            <LandingCarouselSkeleton variant="on-teal" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <section className="pb-6 md:pb-10">
          <LoadingSkeleton className="h-28 w-full rounded-2xl md:h-40 lg:h-48" />
        </section>
      </div>

      <section
        className="mx-auto w-[92%] max-w-6xl rounded-2xl py-8 md:w-full md:rounded-3xl md:py-12"
        style={{ backgroundColor: COTY_CREAM }}
      >
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <LandingFooterSkeleton />
        </div>
      </section>
    </div>
  )
}

export function CustomerMenuSkeleton() {
  return (
    <div
      className="coly-landing min-h-screen bg-white pb-24 md:pb-10"
      aria-busy="true"
      aria-label="Cargando menú"
    >
      <div
        className="w-full rounded-b-4xl md:rounded-b-[2.5rem]"
        style={{ backgroundColor: COTY_HEADER }}
      >
        <div className="relative mx-auto w-full max-w-lg px-4 md:max-w-4xl md:px-6 lg:max-w-6xl lg:px-8">
          <header className="min-h-[207px] pt-6 md:min-h-0 md:pb-12 md:pt-8">
            <LoadingSkeleton className="mx-auto mb-4 h-16 w-32 !bg-white/20 md:hidden" />
            <LoadingSkeleton className="h-11 w-full rounded-full !bg-white/90 md:mx-auto md:max-w-xl md:h-12" />
            <LoadingSkeleton className="mx-auto mt-4 h-7 w-16 !bg-white/20 md:mt-6 md:h-8 md:w-20" />
          </header>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 translate-y-1/2 px-4 md:px-6 lg:px-8">
            <div className="pointer-events-auto md:mx-auto md:max-w-4xl lg:max-w-5xl">
              <MenuCategoryNavSkeleton />
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto w-full max-w-lg -mt-2 rounded-t-[1.75rem] bg-white px-4 pt-14 pb-4 md:max-w-4xl md:rounded-t-4xl md:px-6 md:pt-16 md:pb-8 lg:max-w-6xl lg:px-8">
        <MenuSectionsLoadingSkeleton />
      </main>
    </div>
  )
}

export function LoadingSkeleton({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-[#E8EBEA]', className)} style={style} />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-3">
      <LoadingSkeleton className="aspect-square w-full rounded-lg" />
      <div className="mt-3 space-y-2">
        <LoadingSkeleton className="h-4 w-3/4" />
        <LoadingSkeleton className="h-3 w-full" />
        <LoadingSkeleton className="h-5 w-1/3" />
      </div>
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-5 w-24" />
        <LoadingSkeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-3 space-y-2">
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-2/3" />
      </div>
      <div className="mt-4 flex justify-between">
        <LoadingSkeleton className="h-4 w-20" />
        <LoadingSkeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

export function CustomerOrderStatusSkeleton() {
  return (
    <article className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-5">
        <div className="flex flex-col items-center gap-2">
          <LoadingSkeleton className="h-5 w-44" />
          <LoadingSkeleton className="h-4 w-32" />
          <LoadingSkeleton className="h-7 w-24 rounded-full" />
        </div>
      </div>

      <div className="space-y-5 px-4 py-5">
        <div className="flex justify-between px-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex w-[22%] flex-col items-center gap-2">
              <LoadingSkeleton className="h-10 w-10 rounded-full" />
              <LoadingSkeleton className="h-3 w-full" />
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-[#F8FBFA] p-4">
          <LoadingSkeleton className="mx-auto h-4 w-20" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <LoadingSkeleton className="h-4 w-3/4" />
                  <LoadingSkeleton className="h-3 w-1/2" />
                </div>
                <LoadingSkeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-[#D6E8E6] pt-3">
            <div className="flex justify-between">
              <LoadingSkeleton className="h-4 w-16" />
              <LoadingSkeleton className="h-4 w-14" />
            </div>
            <div className="flex justify-between">
              <LoadingSkeleton className="h-4 w-20" />
              <LoadingSkeleton className="h-4 w-14" />
            </div>
            <div className="flex justify-between pt-1">
              <LoadingSkeleton className="h-5 w-12" />
              <LoadingSkeleton className="h-5 w-16" />
            </div>
          </div>
        </div>

        <LoadingSkeleton className="mx-auto h-10 w-40 rounded-xl" />
      </div>
    </article>
  )
}

export function CustomerOrderStatusListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, index) => (
        <CustomerOrderStatusSkeleton key={index} />
      ))}
    </div>
  )
}

export function TableCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-10 w-10 rounded-full" />
        <LoadingSkeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="mt-3">
        <LoadingSkeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

export function CartItemSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl border border-black/8 bg-white p-3 shadow-sm">
      <LoadingSkeleton className="h-[88px] w-[88px] shrink-0 rounded-xl md:h-[96px] md:w-[96px]" />
      <div className="flex flex-1 flex-col gap-2 pt-1">
        <LoadingSkeleton className="h-4 w-2/3" />
        <LoadingSkeleton className="h-3 w-full" />
        <LoadingSkeleton className="h-3 w-4/5" />
        <LoadingSkeleton className="mt-auto h-8 w-28 rounded-full" />
      </div>
    </div>
  )
}

export function LandingProductCardSkeleton({
  variant = 'default',
}: {
  variant?: 'default' | 'on-teal'
}) {
  return (
    <div
      className={`flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-black/8 shadow-sm md:rounded-3xl ${variant === 'on-teal' ? 'bg-white/95' : 'bg-white'
        }`}
    >
      <LoadingSkeleton className="aspect-4/3 w-full shrink-0 rounded-none" />
      <div className="flex flex-1 flex-col p-3 md:p-4">
        <LoadingSkeleton className="h-4 w-3/4" />
        <LoadingSkeleton className="mt-2 h-3 w-full" />
        <LoadingSkeleton className="mt-1 h-3 w-4/5" />
        <LoadingSkeleton className="mt-2 h-4 w-1/4" />
        <div className="mt-auto flex items-center justify-center gap-2 pt-2">
          <LoadingSkeleton className="h-8 w-8 rounded-full" />
          <LoadingSkeleton className="h-4 w-10" />
          <LoadingSkeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function LandingCarouselSkeleton({
  variant = 'default',
}: {
  variant?: 'default' | 'on-teal'
}) {
  return (
    <div className="relative w-full px-7 md:px-0 lg:px-2">
      <div className="-ml-3 flex items-stretch md:-ml-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'flex min-w-0 basis-[calc(50%-0.375rem)] pl-3 md:basis-[calc(33.333%-0.75rem)] md:pl-4 lg:basis-[calc(25%-0.75rem)]',
              index === 2 && 'hidden md:flex',
              index === 3 && 'hidden lg:flex'
            )}
          >
            <LandingProductCardSkeleton variant={variant} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function LandingFooterSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-8 lg:gap-12">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex flex-col items-center text-center">
          <LoadingSkeleton className="mb-2 h-5 w-5 rounded-full md:mb-3 md:h-6 md:w-6" />
          <LoadingSkeleton className="h-3 w-16 md:h-4 md:w-20" />
          <LoadingSkeleton className="mt-2 h-3 w-full max-w-[120px] md:mt-3" />
          <LoadingSkeleton className="mt-2 h-5 w-20 rounded-full md:mt-3 md:w-24" />
        </div>
      ))}
    </div>
  )
}

export function CheckoutFormSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index}>
          {index > 0 && <div className="border-t border-black/8" />}
          <div className="flex gap-3 p-4">
            <LoadingSkeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <LoadingSkeleton className="h-4 w-40" />
              <LoadingSkeleton className="h-3 w-full" />
              <LoadingSkeleton className="h-3 w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function CheckoutLoadingSkeleton({ itemCount = 2 }: { itemCount?: number }) {
  return (
    <div className="space-y-3">
      <CheckoutFormSkeleton />
    </div>
  )
}
