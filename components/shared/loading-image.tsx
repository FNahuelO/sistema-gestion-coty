'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingImageProps {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  style?: CSSProperties
  loading?: 'lazy' | 'eager'
  skeleton?: boolean
  inline?: boolean
  fallback?: ReactNode
  skeletonClassName?: string
}

export function LoadingImage({
  src,
  alt,
  className,
  imgClassName,
  style,
  loading = 'lazy',
  skeleton = true,
  inline = false,
  fallback,
  skeletonClassName,
}: LoadingImageProps) {
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

  const showSkeleton = skeleton && status !== 'error'

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-[#F8FBFA]',
        inline ? 'inline-block' : 'h-full w-full',
        className,
      )}
    >
      {showSkeleton && (
        <div
          className={cn(
            'absolute inset-0 animate-pulse bg-[#E8EBEA] transition-opacity duration-300',
            status === 'loaded' ? 'opacity-0' : 'opacity-100',
            skeletonClassName,
          )}
          aria-hidden
        />
      )}
      {status === 'error' ? (
        <div className="flex h-full w-full min-h-[inherit] items-center justify-center bg-[#F8FBFA]">
          {fallback ?? <ImageOff className="h-6 w-6 text-[#2D5A57]/30" aria-hidden />}
        </div>
      ) : (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          style={style}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={cn(
            'transition-opacity duration-300',
            !inline && 'h-full w-full object-cover',
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      )}
    </div>
  )
}
