'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
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
}

export function MultiSelectField({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Sin resultados',
}: MultiSelectFieldProps) {
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

  const removeOption = (optionValue: string) => {
    onChange(value.filter((item) => item !== optionValue))
  }

  const triggerLabel =
    selectedOptions.length === 0
      ? placeholder
      : `${selectedOptions.length} seleccionado${selectedOptions.length === 1 ? '' : 's'}`

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-sm',
              'hover:bg-[#F8FBFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7EB8B3]'
            )}
          >
            <span className={cn('truncate', selectedOptions.length === 0 && 'text-muted-foreground')}>
              {triggerLabel}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(100vw-2rem,24rem)] p-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-64 pr-2">
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
          </ScrollArea>
          {value.length > 0 && (
            <div className="mt-3 flex justify-end border-t pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
                Limpiar selección
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => (
            <Badge key={option.value} variant="secondary" className="gap-1 pr-1">
              {option.label}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted"
                onClick={() => removeOption(option.value)}
                aria-label={`Quitar ${option.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
