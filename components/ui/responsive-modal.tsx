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
}: ResponsiveModalProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <MobileBottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        footer={footer}
        bodyClassName={bodyClassName}
        hideCloseButton={hideCloseButton}
        className={className}
      >
        {children}
      </MobileBottomSheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={!hideCloseButton}
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
