'use client'

import type { ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'

type ActionItem = {
  key: string
  label: string
  icon?: ReactNode
  onClick: () => void
  active?: boolean
  variant?: 'default' | 'destructive'
}

export function AdminResponsiveActions({
  primary,
  secondary = [],
  className,
}: {
  primary: ActionItem
  secondary?: ActionItem[]
  className?: string
}) {
  return (
    <div className={cn('flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap', className)}>
      <Button
        className={cn('h-11 w-full sm:h-9 sm:w-auto', PANEL_PRIMARY_BTN)}
        onClick={primary.onClick}
      >
        {primary.icon}
        {primary.label}
      </Button>
      {secondary.length > 0 ? (
        <>
          <div className="hidden flex-wrap gap-2 sm:flex">
            {secondary.map((action) => (
              <Button
                key={action.key}
                variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                size="sm"
                className={cn('h-9', action.variant !== 'destructive' && PANEL_OUTLINE_BTN, action.active && 'border-primary bg-[#F0F7F6] dark:bg-primary/10')}
                onClick={action.onClick}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={cn('h-11 w-full sm:hidden', PANEL_OUTLINE_BTN)}>
                <MoreHorizontal className="mr-2 h-4 w-4" />
                Más acciones
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {secondary.map((action) => (
                <DropdownMenuItem
                  key={action.key}
                  onClick={action.onClick}
                  className={cn('min-h-11', action.variant === 'destructive' && 'text-destructive focus:text-destructive')}
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : null}
    </div>
  )
}
