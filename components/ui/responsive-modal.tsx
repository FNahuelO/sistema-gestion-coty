'use client'

import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MobileBottomSheet } from '@/components/ui/mobile-bottom-sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { PANEL_TITLE } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'

type ResponsiveModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
  bodyClassName?: string
  maxWidthClassName?: string
  hideCloseButton?: boolean
  /** Evita cerrar al interactuar fuera (p. ej. otro modal anidado encima). */
  preventDismiss?: boolean
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  bodyClassName,
  maxWidthClassName = 'sm:max-w-lg',
  hideCloseButton = false,
  preventDismiss = false,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile()

  const handleOpenChange = (next: boolean) => {
    if (!next && preventDismiss) return
    onOpenChange(next)
  }

  const blockOutside = (event: Event) => {
    if (preventDismiss) event.preventDefault()
  }

  if (isMobile) {
    return (
      <MobileBottomSheet
        open={open}
        onOpenChange={handleOpenChange}
        title={title}
        description={description}
        footer={footer}
        bodyClassName={bodyClassName}
        hideCloseButton={hideCloseButton}
        className={className}
        preventDismiss={preventDismiss}
      >
        {children}
      </MobileBottomSheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!hideCloseButton}
        onInteractOutside={blockOutside}
        onPointerDownOutside={blockOutside}
        onFocusOutside={blockOutside}
        className={cn(
          'flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-2xl p-0',
          maxWidthClassName,
          className
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-border px-5 py-4 text-left">
          <DialogTitle className={PANEL_TITLE}>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-4', bodyClassName)}>{children}</div>
        {footer ? <div className="shrink-0 border-t border-border px-5 py-4">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  )
}
