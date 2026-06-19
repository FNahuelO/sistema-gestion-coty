'use client'

import { cn } from '@/lib/utils'

/** Padding inferior para contenido cuando hay bottom nav fijo (admin/staff móvil). */
export function MobileShellPadding({ className }: { className?: string }) {
  return <div className={cn('h-[calc(4.5rem+env(safe-area-inset-bottom))] shrink-0 lg:hidden', className)} aria-hidden />
}
