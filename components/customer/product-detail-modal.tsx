'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleModal } from '@/components/ui/simple-modal'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Product, Promotion, SelectedOption } from '@/lib/types'
import { getDiscountedUnitPrice } from '@/lib/promotions'

interface ProductDetailModalProps {
  product: Product
  promotions?: Promotion[]
  onClose: () => void
  onAddToCart: (product: Product, quantity: number, options: SelectedOption[], notes?: string) => void
}

export function ProductDetailModal({ product, promotions = [], onClose, onAddToCart }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (product) {
      setQuantity(1)
      setSelectedOptions([])
      setNotes('')
    }
  }, [product])

  const handleOptionChange = (optionId: string, choiceId: string, multiple: boolean) => {
    setSelectedOptions((prev) => {
      const existing = prev.find((o) => o.optionId === optionId)

      if (multiple) {
        if (existing) {
          const hasChoice = existing.choiceIds.includes(choiceId)
          if (hasChoice) {
            const newChoices = existing.choiceIds.filter((id) => id !== choiceId)
            if (newChoices.length === 0) {
              return prev.filter((o) => o.optionId !== optionId)
            }
            return prev.map((o) =>
              o.optionId === optionId ? { ...o, choiceIds: newChoices } : o
            )
          }
          return prev.map((o) =>
            o.optionId === optionId ? { ...o, choiceIds: [...o.choiceIds, choiceId] } : o
          )
        }
        return [...prev, { optionId, choiceIds: [choiceId] }]
      }

      if (existing) {
        return prev.map((o) => (o.optionId === optionId ? { ...o, choiceIds: [choiceId] } : o))
      }
      return [...prev, { optionId, choiceIds: [choiceId] }]
    })
  }

  const unitPrice = getDiscountedUnitPrice(product, selectedOptions, promotions)
  const calculatePrice = () => unitPrice * quantity

  const canAddToCart = () => {
    const requiredOptions = product.options?.filter((o) => o.required) || []
    return requiredOptions.every((option) =>
      selectedOptions.some((so) => so.optionId === option.id && so.choiceIds.length > 0)
    )
  }

  return (
    <SimpleModal open onClose={onClose} title={product.name} className="max-w-lg rounded-[1.75rem] bg-card/95">
      <div className="overflow-y-auto p-3 pt-10 sm:max-w-lg">
        <div className="relative aspect-video overflow-hidden rounded-[1.25rem]">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl font-bold">{product.name}</h2>
            <p className="mt-1 text-muted-foreground">{product.description}</p>
          </div>

          {product.options?.map((option) => (
            <div key={option.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  {option.name}
                  {option.required && <span className="ml-1 text-destructive">*</span>}
                </Label>
                {!option.required && (
                  <span className="text-xs text-muted-foreground">Opcional</span>
                )}
              </div>

              {option.multiple ? (
                <div className="space-y-2">
                  {option.choices.map((choice) => (
                    <div
                      key={choice.id}
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`${option.id}-${choice.id}`}
                          checked={selectedOptions.some(
                            (so) =>
                              so.optionId === option.id && so.choiceIds.includes(choice.id)
                          )}
                          onCheckedChange={() => handleOptionChange(option.id, choice.id, true)}
                        />
                        <Label htmlFor={`${option.id}-${choice.id}`} className="cursor-pointer">
                          {choice.name}
                        </Label>
                      </div>
                      {choice.priceModifier > 0 && (
                        <span className="text-sm text-muted-foreground">
                          +${choice.priceModifier}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <RadioGroup
                  value={selectedOptions.find((so) => so.optionId === option.id)?.choiceIds[0] || ''}
                  onValueChange={(value) => handleOptionChange(option.id, value, false)}
                >
                  {option.choices.map((choice) => (
                    <div
                      key={choice.id}
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={choice.id} id={`${option.id}-${choice.id}`} />
                        <Label htmlFor={`${option.id}-${choice.id}`} className="cursor-pointer">
                          {choice.name}
                        </Label>
                      </div>
                      {choice.priceModifier > 0 && (
                        <span className="text-sm text-muted-foreground">
                          +${choice.priceModifier}
                        </span>
                      )}
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          ))}

          <div className="space-y-2">
            <Label>Notas especiales</Label>
            <Textarea
              placeholder="Ej: Sin azúcar, extra caliente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              className="flex-1 gap-2 rounded-full shadow-lg shadow-primary/20"
              disabled={!canAddToCart()}
              onClick={() => {
                onAddToCart(product, quantity, selectedOptions, notes || undefined)
                setQuantity(1)
                setSelectedOptions([])
                setNotes('')
              }}
            >
              Agregar
              <span className="font-serif font-bold">${calculatePrice().toFixed(2)}</span>
            </Button>
          </div>
        </div>
      </div>
    </SimpleModal>
  )
}
