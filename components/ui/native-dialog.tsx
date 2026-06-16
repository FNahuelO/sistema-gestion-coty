'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  position = 'center',
  maxWidthClassName = 'max-w-lg',
}: NativeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      return
    }

    if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => onOpenChange(false)
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onOpenChange])

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'm-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0',
        'backdrop:bg-black/50',
        className
      )}
      onCancel={(event) => {
        event.preventDefault()
        onOpenChange(false)
      }}
    >
      <div
        className={cn(
          'flex min-h-full w-full p-3 sm:p-4',
          position === 'bottom' ? 'items-end justify-center' : 'items-center justify-center'
        )}
        onClick={() => onOpenChange(false)}
      >
        <div
          role="document"
          className={cn(
            'flex w-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl',
            position === 'bottom' ? 'max-h-[85vh] rounded-b-2xl' : 'max-h-[min(90vh,100%)]',
            maxWidthClassName,
            contentClassName
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#2D5A57]">{title}</h2>
              {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-[#F8FBFA] hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className={cn('px-5 py-4', NATIVE_SCROLL_CLASS, bodyClassName)}>{children}</div>
        </div>
      </div>
    </dialog>
  )
}
