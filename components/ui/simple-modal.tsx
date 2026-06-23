'use client'

import type { ReactNode } from 'react'
import { ResponsiveModal } from '@/components/ui/responsive-modal'

interface SimpleModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  title?: string
  description?: string
  footer?: ReactNode
  bodyClassName?: string
}

export function SimpleModal({
  open,
  onClose,
  children,
  className,
  title = 'Modal',
  description,
  footer,
  bodyClassName,
}: SimpleModalProps) {
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={title}
      description={description}
      className={className}
      bodyClassName={bodyClassName}
      footer={footer}
    >
      {children}
    </ResponsiveModal>
  )
}
