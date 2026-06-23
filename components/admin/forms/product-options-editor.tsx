'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { ProductOption } from '@/lib/types'
import { PANEL_BORDER, PANEL_LIST_ROW, PANEL_OUTLINE_BTN, PANEL_SURFACE, PANEL_TOGGLE_ROW } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'

const OPTION_ROW = cn(PANEL_SURFACE, 'rounded-xl border p-3', PANEL_BORDER)
const CHOICE_ROW = cn(PANEL_LIST_ROW, 'rounded-lg p-2')

function createOption(): ProductOption {
  return {
    id: `option-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    required: false,
    multiple: false,
    choices: [],
  }
}

function createChoice() {
  return {
    id: `choice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    priceModifier: 0,
  }
}

type ProductOptionsEditorProps = {
  value: ProductOption[]
  onChange: (value: ProductOption[]) => void
}

export function ProductOptionsEditor({ value, onChange }: ProductOptionsEditorProps) {
  const updateOption = (optionId: string, patch: Partial<ProductOption>) => {
    onChange(value.map((option) => (option.id === optionId ? { ...option, ...patch } : option)))
  }

  const removeOption = (optionId: string) => {
    onChange(value.filter((option) => option.id !== optionId))
  }

  const addChoice = (optionId: string) => {
    onChange(
      value.map((option) =>
        option.id === optionId
          ? { ...option, choices: [...option.choices, createChoice()] }
          : option
      )
    )
  }

  const updateChoice = (
    optionId: string,
    choiceId: string,
    patch: Partial<ProductOption['choices'][number]>
  ) => {
    onChange(
      value.map((option) =>
        option.id === optionId
          ? {
              ...option,
              choices: option.choices.map((choice) =>
                choice.id === choiceId ? { ...choice, ...patch } : choice
              ),
            }
          : option
      )
    )
  }

  const removeChoice = (optionId: string, choiceId: string) => {
    onChange(
      value.map((option) =>
        option.id === optionId
          ? { ...option, choices: option.choices.filter((choice) => choice.id !== choiceId) }
          : option
      )
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Definí grupos de opciones como Tamaño o Extras, y sus variantes con precio adicional.
      </p>

      {value.length === 0 ? (
        <div className={cn(OPTION_ROW, 'text-center text-sm text-muted-foreground')}>
          Sin opciones configuradas
        </div>
      ) : (
        value.map((option, optionIndex) => (
          <div key={option.id} className={cn(OPTION_ROW, 'space-y-3')}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Grupo {optionIndex + 1}</Label>
                  <Input
                    value={option.name}
                    onChange={(event) => updateOption(option.id, { name: event.target.value })}
                    placeholder="Ej: Tamaño, Leche, Extras"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className={cn(PANEL_TOGGLE_ROW, 'px-3 py-2')}>
                    <Label className="text-sm">Obligatoria</Label>
                    <Switch
                      checked={option.required}
                      onCheckedChange={(checked) => updateOption(option.id, { required: checked })}
                    />
                  </div>
                  <div className={cn(PANEL_TOGGLE_ROW, 'px-3 py-2')}>
                    <Label className="text-sm">Múltiple</Label>
                    <Switch
                      checked={option.multiple}
                      onCheckedChange={(checked) => updateOption(option.id, { multiple: checked })}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => removeOption(option.id)}
                aria-label="Eliminar grupo de opciones"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Variantes</Label>

              {option.choices.length === 0 ? (
                <p className="text-xs text-muted-foreground">Agregá al menos una variante</p>
              ) : (
                option.choices.map((choice) => (
                  <div key={choice.id} className={cn(CHOICE_ROW, 'flex flex-col gap-2 sm:flex-row sm:items-center')}>
                    <Input
                      value={choice.name}
                      onChange={(event) => updateChoice(option.id, choice.id, { name: event.target.value })}
                      placeholder="Ej: Grande, Leche de avena"
                      className="sm:flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label className="shrink-0 text-xs text-muted-foreground">+$</Label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={choice.priceModifier}
                          onChange={(event) =>
                            updateChoice(option.id, choice.id, {
                              priceModifier: Number(event.target.value) || 0,
                            })
                          }
                          className="w-24"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeChoice(option.id, choice.id)}
                        aria-label="Eliminar variante"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className={PANEL_OUTLINE_BTN}
                onClick={() => addChoice(option.id)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Agregar variante
              </Button>
            </div>
          </div>
        ))
      )}

      <Button
        type="button"
        variant="outline"
        className={cn('w-full', PANEL_OUTLINE_BTN)}
        onClick={() => onChange([...value, createOption()])}
      >
        <Plus className="mr-2 h-4 w-4" />
        Agregar grupo de opciones
      </Button>
    </div>
  )
}

export function normalizeProductOptions(options: ProductOption[]): ProductOption[] {
  return options
    .map((option) => ({
      ...option,
      name: option.name.trim(),
      choices: option.choices
        .map((choice) => ({
          ...choice,
          name: choice.name.trim(),
          priceModifier: Number.isFinite(choice.priceModifier) ? choice.priceModifier : 0,
        }))
        .filter((choice) => choice.name.length > 0),
    }))
    .filter((option) => option.name.length > 0 && option.choices.length > 0)
}
