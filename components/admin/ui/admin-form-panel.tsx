'use client'

import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { MobileBottomSheet } from '@/components/ui/mobile-bottom-sheet'
import { PANEL_BORDER, PANEL_CARD, PANEL_ICON_ACTIVE, PANEL_INTERACTIVE_HOVER, PANEL_TITLE } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import type { FormSection } from '../types'

export function AdminFormPanel({
  panelId,
  title,
  open,
  onOpenChange,
  children,
}: {
  panelId: FormSection
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <MobileBottomSheet open={open} onOpenChange={onOpenChange} title={title}>
        <div id={`admin-form-panel-${panelId}`} className="space-y-3">{children}</div>
      </MobileBottomSheet>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <Card id={`admin-form-panel-${panelId}`} className={cn(PANEL_CARD, 'scroll-mt-24')}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn('flex min-h-11 w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors', PANEL_INTERACTIVE_HOVER)}
          >
            <span className={PANEL_TITLE}>{title}</span>
            <ChevronDown
              className={cn('h-5 w-5 shrink-0 transition-transform duration-200', PANEL_ICON_ACTIVE, open && 'rotate-180')}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className={cn('space-y-3 border-t pt-4', PANEL_BORDER)}>{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
