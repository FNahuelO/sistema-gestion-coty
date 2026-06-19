import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PANEL_PRIMARY_BTN } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'

export function AdminPageHeader({
  title,
  description,
  onNew,
  newLabel = 'Nuevo',
  action,
}: {
  title: string
  description?: string
  onNew?: () => void
  newLabel?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-foreground sm:text-sm">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className="w-full shrink-0 sm:w-auto">
      {action ?? (onNew ? (
        <Button size="default" className={cn('h-11 w-full sm:h-9 sm:w-auto', PANEL_PRIMARY_BTN)} onClick={onNew}>
          <Plus className="mr-1.5 h-4 w-4" />
          {newLabel}
        </Button>
      ) : null)}
      </div>
    </div>
  )
}
