'use client'

import { useMemo, useState, type ComponentProps } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NativeDialog, NATIVE_SCROLL_CLASS } from '@/components/ui/native-dialog'
import { useIsMobile } from '@/hooks/use-mobile'
import { COTY_TEAL } from '@/lib/coty-theme'
import { CATEGORY_ICON_OPTIONS } from '@/lib/category-icon-options'
import { formatCategoryIconLabel } from '@/lib/category-icons'
import { renderCategoryIcon } from '@/lib/render-category-icon'
import { cn } from '@/lib/utils'

type CategoryIconPickerProps = {
  value: string
  onChange: (icon: string) => void
}

function IconPickerGrid({
  value,
  filteredIcons,
  onSelect,
}: {
  value: string
  filteredIcons: typeof CATEGORY_ICON_OPTIONS
  onSelect: (slug: string) => void
}) {
  if (filteredIcons.length === 0) {
    return <p className="py-8 text-center text-xs text-muted-foreground">Sin resultados</p>
  }

  return (
    <div className="grid grid-cols-6 gap-1 sm:grid-cols-7">
      {filteredIcons.map((option) => {
        const isSelected = value === option.slug
        return (
          <button
            key={option.slug}
            type="button"
            title={option.label}
            onClick={() => onSelect(option.slug)}
            className={cn(
              'flex h-10 w-full flex-col items-center justify-center rounded-lg transition-colors',
              isSelected
                ? 'bg-[#C5DDD9]/60 text-[#2D5A57] ring-1 ring-[#7EB8B3]'
                : 'text-muted-foreground hover:bg-[#F8FBFA] hover:text-[#2D5A57]'
            )}
          >
            {renderCategoryIcon(option.slug, { className: 'h-4 w-4' })}
          </button>
        )
      })}
    </div>
  )
}

function IconPickerBody({
  value,
  query,
  onQueryChange,
  filteredIcons,
  onSelect,
  scrollClassName,
}: {
  value: string
  query: string
  onQueryChange: (value: string) => void
  filteredIcons: typeof CATEGORY_ICON_OPTIONS
  onSelect: (slug: string) => void
  scrollClassName?: string
}) {
  return (
    <>
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar icono..."
          className="pl-9"
        />
      </div>
      <div className={cn(NATIVE_SCROLL_CLASS, scrollClassName)}>
        <IconPickerGrid value={value} filteredIcons={filteredIcons} onSelect={onSelect} />
      </div>
    </>
  )
}

function PickerTrigger({
  value,
  ...props
}: { value: string } & ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-sm',
        'hover:bg-[#F8FBFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7EB8B3]'
      )}
      {...props}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F8FBFA]">
          {renderCategoryIcon(value, { className: 'h-4 w-4', style: { color: COTY_TEAL } })}
        </span>
        <span className="truncate text-foreground">
          {value ? formatCategoryIconLabel(value) : 'Elegir icono'}
        </span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

export function CategoryIconPicker({ value, onChange }: CategoryIconPickerProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

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

  const body = (
    <IconPickerBody
      value={value}
      query={query}
      onQueryChange={setQuery}
      filteredIcons={filteredIcons}
      onSelect={selectIcon}
      scrollClassName={isMobile ? 'max-h-[55vh]' : 'max-h-72'}
    />
  )

  if (isMobile) {
    return (
      <>
        <PickerTrigger value={value} onClick={() => setOpen(true)} />
        <NativeDialog
          open={open}
          onOpenChange={setOpen}
          title="Elegir icono"
          position="bottom"
          maxWidthClassName="max-w-none"
          bodyClassName="pb-6"
        >
          {body}
        </NativeDialog>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <PickerTrigger value={value} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(100vw-2rem,22rem)] p-3">
        {body}
      </PopoverContent>
    </Popover>
  )
}
