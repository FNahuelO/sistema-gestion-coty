'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export const PROMO_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1436076865539-06670f77990b?w=1600&h=400&fit=crop'

type PromotionBannerProps = {
  title: string
  image?: string
  discount?: number
  validTo?: Date
  variant?: 'hero' | 'card'
  className?: string
}

export function PromotionBanner({
  title,
  image,
  discount,
  validTo,
  variant = 'card',
  className,
}: PromotionBannerProps) {
  const isHero = variant === 'hero'

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-black md:rounded-3xl',
        isHero ? 'h-28 md:h-40 lg:h-48' : 'h-32 md:h-40',
        className
      )}
    >
      <img
        src={image || PROMO_FALLBACK_IMAGE}
        alt={title}
        className="h-full w-full object-cover opacity-60"
      />
      <div
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center bg-black/40 px-4 text-center',
          isHero && 'px-6'
        )}
      >
        <p
          className={cn(
            'coly-promo-outline font-black uppercase leading-none',
            isHero
              ? 'text-center text-3xl md:text-5xl lg:text-6xl'
              : 'text-2xl md:text-4xl'
          )}
        >
          {title}
        </p>
        {!isHero && discount !== undefined ? (
          <p className="mt-2 text-sm font-semibold text-white md:text-base">{discount}% OFF</p>
        ) : null}
        {!isHero && validTo ? (
          <p className="mt-1 text-xs text-white/75">
            Válida hasta {format(validTo, "d 'de' MMMM", { locale: es })}
          </p>
        ) : null}
      </div>
    </div>
  )
}
