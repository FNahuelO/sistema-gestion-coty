'use client'

import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PANEL_CARD, PANEL_TITLE } from '@/lib/panel-theme'
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
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[92vh] overflow-y-auto rounded-t-2xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          id={`admin-form-panel-${panelId}`}
        >
          <SheetHeader className="pb-2 text-left">
            <SheetTitle className={PANEL_TITLE}>{title}</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 pt-2">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <Card id={`admin-form-panel-${panelId}`} className={cn(PANEL_CARD, 'scroll-mt-24')}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[#F8FBFA]"
          >
            <span className={PANEL_TITLE}>{title}</span>
            <ChevronDown
              className={cn('h-5 w-5 shrink-0 text-[#2D5A57] transition-transform duration-200', open && 'rotate-180')}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3 border-t border-gray-100 pt-4">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
