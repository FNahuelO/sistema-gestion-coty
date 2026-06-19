import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-[#2D5A57]/80">{label}</Label>
      {children}
    </div>
  )
}
