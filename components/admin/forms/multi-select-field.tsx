'use client'

import { useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NativeDialog, NATIVE_SCROLL_CLASS } from '@/components/ui/native-dialog'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

export type MultiSelectOption = {
  value: string
  label: string
  description?: string
}

type MultiSelectFieldProps = {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  dialogTitle?: string
}

function MultiSelectTrigger({
  triggerLabel,
  hasSelection,
  ...props
}: { triggerLabel: string; hasSelection: boolean } & ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-sm',
        'hover:bg-[#F8FBFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7EB8B3]'
      )}
      {...props}
    >
      <span className={cn('truncate', !hasSelection && 'text-muted-foreground')}>{triggerLabel}</span>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

function MultiSelectBody({
  query,
  onQueryChange,
  searchPlaceholder,
  emptyMessage,
  filteredOptions,
  value,
  toggleOption,
  onClear,
}: {
  query: string
  onQueryChange: (value: string) => void
  searchPlaceholder: string
  emptyMessage: string
  filteredOptions: MultiSelectOption[]
  value: string[]
  toggleOption: (optionValue: string) => void
  onClear: () => void
}) {
  return (
    <>
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>
      <div className={cn(NATIVE_SCROLL_CLASS, 'max-h-64')}>
        {filteredOptions.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="space-y-1">
            {filteredOptions.map((option) => {
              const checked = value.includes(option.value)
              return (
                <label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[#F8FBFA]',
                    checked && 'bg-[#F8FBFA]'
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleOption(option.value)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{option.label}</span>
                    {option.description && (
                      <span className="block text-xs text-muted-foreground">{option.description}</span>
                    )}
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </div>
      {value.length > 0 && (
        <div className="mt-3 flex justify-end border-t pt-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Limpiar selección
          </Button>
        </div>
      )}
    </>
  )
}

function SelectedBadges({
  selectedOptions,
  onRemove,
}: {
  selectedOptions: MultiSelectOption[]
  onRemove: (value: string) => void
}) {
  if (selectedOptions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {selectedOptions.map((option) => (
        <Badge key={option.value} variant="secondary" className="gap-1 pr-1">
          {option.label}
          <button
            type="button"
            className="rounded-full p-0.5 hover:bg-muted"
            onClick={() => onRemove(option.value)}
            aria-label={`Quitar ${option.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}

export function MultiSelectField({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Sin resultados',
  dialogTitle = 'Seleccionar opciones',
}: MultiSelectFieldProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selectedOptions = useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value]
  )

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(normalized) ||
        option.description?.toLowerCase().includes(normalized) ||
        option.value.toLowerCase().includes(normalized)
    )
  }, [options, query])

  const toggleOption = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue]
    )
  }

  const triggerLabel =
    selectedOptions.length === 0
      ? placeholder
      : `${selectedOptions.length} seleccionado${selectedOptions.length === 1 ? '' : 's'}`

  const body = (
    <MultiSelectBody
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      filteredOptions={filteredOptions}
      value={value}
      toggleOption={toggleOption}
      onClear={() => onChange([])}
    />
  )

  const badges = (
    <SelectedBadges
      selectedOptions={selectedOptions}
      onRemove={(optionValue) => onChange(value.filter((item) => item !== optionValue))}
    />
  )

  if (isMobile) {
    return (
      <div className="space-y-2">
        <MultiSelectTrigger
          triggerLabel={triggerLabel}
          hasSelection={selectedOptions.length > 0}
          onClick={() => setOpen(true)}
        />
        <NativeDialog
          open={open}
          onOpenChange={setOpen}
          title={dialogTitle}
          position="bottom"
          maxWidthClassName="max-w-none"
          bodyClassName="pb-6"
        >
          {body}
        </NativeDialog>
        {badges}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <MultiSelectTrigger triggerLabel={triggerLabel} hasSelection={selectedOptions.length > 0} />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(100vw-2rem,24rem)] p-3">
          {body}
        </PopoverContent>
      </Popover>
      {badges}
    </div>
  )
}
