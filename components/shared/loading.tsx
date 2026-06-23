'use client'

import { Coffee } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Coffee className="h-10 w-10 animate-pulse text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Cargando...</p>
      </div>
    </div>
  )
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-[#E8EBEA] ${className}`} />
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
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="flex min-w-0 basis-[calc(50%-0.375rem)] pl-3 md:basis-[calc(33.333%-0.75rem)] md:pl-4 lg:basis-[calc(25%-0.75rem)]"
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
