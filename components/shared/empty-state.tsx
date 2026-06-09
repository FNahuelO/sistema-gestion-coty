'use client'

import { Coffee, ShoppingBag, Search, FileX, Users, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: 'coffee' | 'cart' | 'search' | 'file' | 'users' | 'package'
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

const icons = {
  coffee: Coffee,
  cart: ShoppingBag,
  search: Search,
  file: FileX,
  users: Users,
  package: Package,
}

export function EmptyState({ icon = 'coffee', title, description, action }: EmptyStateProps) {
  const Icon = icons[icon]

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-4 max-w-xs text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
