'use client'

import { useEffect, useRef, useState } from 'react'
import { Coffee } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductImageProps {
  src: string
  alt: string
  className?: string
  imgClassName?: string
}

export function ProductImage({ src, alt, className, imgClassName }: ProductImageProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  useEffect(() => {
    setStatus('loading')
    const img = imgRef.current
    if (!img) return
    if (img.complete) {
      setStatus(img.naturalWidth > 0 ? 'loaded' : 'error')
    }
  }, [src])

  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-[#F8FBFA]', className)}>
      {status !== 'error' && (
        <div
          className={cn(
            'absolute inset-0 animate-pulse bg-[#E8EBEA] transition-opacity duration-300',
            status === 'loaded' ? 'opacity-0' : 'opacity-100',
          )}
          aria-hidden
        />
      )}
      {status === 'error' ? (
        <div className="flex h-full w-full items-center justify-center bg-[#F8FBFA]">
          <Coffee className="h-8 w-8 text-[#2D5A57]/30" aria-hidden />
        </div>
      ) : (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-300',
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      )}
    </div>
  )
}
