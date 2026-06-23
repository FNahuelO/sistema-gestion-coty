'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAdminTheme } from '@/lib/admin-theme'
import { PANEL_BTN_GHOST } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'

export function AdminThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useAdminTheme()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Activar tema oscuro' : 'Activar tema claro'}
      className={cn('h-11 w-11 shrink-0', PANEL_BTN_GHOST, className)}
    >
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  )
}
