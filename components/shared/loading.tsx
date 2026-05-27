'use client'

import { motion } from 'framer-motion'
import { Coffee } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Coffee className="h-12 w-12 text-primary" />
        </motion.div>
        <p className="text-lg font-medium text-muted-foreground">Cargando...</p>
      </motion.div>
    </div>
  )
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-muted ${className}`} />
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
