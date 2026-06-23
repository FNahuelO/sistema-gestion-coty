import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

import { PANEL_LABEL } from '@/lib/panel-theme'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className={PANEL_LABEL}>{label}</Label>
      {children}
    </div>
  )
}
