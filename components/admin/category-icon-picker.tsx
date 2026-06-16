'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { COTY_TEAL } from '@/lib/coty-theme'
import { CATEGORY_ICON_OPTIONS } from '@/lib/category-icon-options'
import { formatCategoryIconLabel, getCategoryIcon } from '@/lib/category-icons'
import { cn } from '@/lib/utils'

type CategoryIconPickerProps = {
  value: string
  onChange: (icon: string) => void
}

export function CategoryIconPicker({ value, onChange }: CategoryIconPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const SelectedIcon = getCategoryIcon(value)

  const filteredIcons = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return CATEGORY_ICON_OPTIONS
    return CATEGORY_ICON_OPTIONS.filter(
      (option) =>
        option.slug.includes(normalized) ||
        option.label.toLowerCase().includes(normalized)
    )
  }, [query])

  const selectIcon = (slug: string) => {
    onChange(slug)
    setOpen(false)
    setQuery('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-sm',
            'hover:bg-[#F8FBFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7EB8B3]'
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F8FBFA]">
              <SelectedIcon className="h-4 w-4" style={{ color: COTY_TEAL }} />
            </span>
            <span className="truncate text-foreground">
              {value ? formatCategoryIconLabel(value) : 'Elegir icono'}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(100vw-2rem,22rem)] p-3">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar icono..."
            className="pl-9"
          />
        </div>
        <ScrollArea className="h-72 pr-2">
          {filteredIcons.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">Sin resultados</p>
          ) : (
            <div className="grid grid-cols-6 gap-1 sm:grid-cols-7">
              {filteredIcons.map((option) => {
                const Icon = getCategoryIcon(option.slug)
                const isSelected = value === option.slug
                return (
                  <button
                    key={option.slug}
                    type="button"
                    title={option.label}
                    onClick={() => selectIcon(option.slug)}
                    className={cn(
                      'flex h-10 w-full flex-col items-center justify-center rounded-lg transition-colors',
                      isSelected
                        ? 'bg-[#C5DDD9]/60 text-[#2D5A57] ring-1 ring-[#7EB8B3]'
                        : 'text-muted-foreground hover:bg-[#F8FBFA] hover:text-[#2D5A57]'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
