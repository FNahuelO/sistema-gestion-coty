'use client'

import { COTY_HEADER, LOGO_SRC_SVG } from '@/lib/coty-theme'
import { PANEL_BG } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'

export function AdminLoadingScreen() {
  return (
    <div
      className={cn('flex min-h-screen flex-col items-center justify-center px-6', PANEL_BG)}
      role="status"
      aria-live="polite"
      aria-label="Cargando panel de administración"
    >
      <div className="flex flex-col items-center gap-5">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full shadow-sm ring-4 ring-[#C5DDD9]/40 dark:ring-primary/20"
          style={{ backgroundColor: COTY_HEADER }}
        >
          <img src={LOGO_SRC_SVG} alt="Coty Cafe" className="h-auto w-8 object-contain" />
        </div>

        <div className="text-center">
          <p className="font-serif text-xl font-bold text-foreground">Coty Cafe</p>
          <p className="mt-1 text-sm text-muted-foreground">Cargando panel...</p>
        </div>

        <div className="flex items-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"
              style={{ animationDelay: `${index * 180}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
