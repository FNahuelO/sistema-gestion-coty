'use client'

import type { ReactNode } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PANEL_TITLE } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'

export const MOBILE_BOTTOM_SHEET_CLASS =
  'max-h-[92vh] gap-0 overflow-y-auto rounded-t-2xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]'

export const MOBILE_BOTTOM_SHEET_SCROLL_CLASS =
  'min-h-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]'

type MobileBottomSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
  bodyClassName?: string
  hideCloseButton?: boolean
}

export function MobileBottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  bodyClassName,
  hideCloseButton = false,
}: MobileBottomSheetProps) {
  const hasFooter = Boolean(footer)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        // Evita que el teclado del celular se abra solo al abrir el panel:
        // el foco automático en el primer input se cancela; el teclado sólo
        // aparece cuando el usuario toca un input manualmente.
        onOpenAutoFocus={(event) => event.preventDefault()}
        className={cn(
          hasFooter
            ? 'flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-t-2xl border-t p-0'
            : MOBILE_BOTTOM_SHEET_CLASS,
          hideCloseButton && '[&>button]:hidden',
          className
        )}
      >
        <SheetHeader className={cn('space-y-1 text-left', hasFooter ? 'shrink-0 px-4 pb-2 pt-4' : 'px-0 pb-2')}>
          <SheetTitle className={PANEL_TITLE}>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>

        {hasFooter ? (
          <>
            <div className={cn(MOBILE_BOTTOM_SHEET_SCROLL_CLASS, 'flex-1 px-4', bodyClassName)}>{children}</div>
            <div
              className="shrink-0 border-t border-border bg-background px-4 py-4"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              {footer}
            </div>
          </>
        ) : (
          <div className={cn('space-y-3 pt-2', bodyClassName)}>{children}</div>
        )}
      </SheetContent>
    </Sheet>
  )
}
