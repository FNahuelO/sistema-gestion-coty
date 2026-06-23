'use client'

import type { ReactNode } from 'react'
import { ResponsiveModal } from '@/components/ui/responsive-modal'

export const NATIVE_SCROLL_CLASS =
  'min-h-0 overflow-y-auto overscroll-contain pr-1 touch-pan-y [-webkit-overflow-scrolling:touch]'

type NativeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
  contentClassName?: string
  bodyClassName?: string
  position?: 'center' | 'bottom'
  maxWidthClassName?: string
}

export function NativeDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  contentClassName,
  bodyClassName,
  maxWidthClassName = 'max-w-lg',
}: NativeDialogProps) {
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className={className ?? contentClassName}
      bodyClassName={bodyClassName}
      maxWidthClassName={maxWidthClassName}
    >
      {children}
    </ResponsiveModal>
  )
}
