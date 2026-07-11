'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus } from 'lucide-react'
import { SimpleModal } from '@/components/ui/simple-modal'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Product, Promotion, SelectedOption } from '@/lib/types'
import { getDiscountedUnitPrice, getProductDiscountPercent } from '@/lib/promotions'
import { COTY_QTY_BG, COTY_TEAL, formatPrice } from '@/lib/coty-theme'
import { cn } from '@/lib/utils'
import { ProductImage } from '@/components/customer/product-image'

interface ProductDetailModalProps {
  product: Product
  promotions?: Promotion[]
  onClose: () => void
  onAddToCart: (product: Product, quantity: number, options: SelectedOption[], notes?: string) => void
}

const OPTION_CONTROL_CLASS =
  'border-[#2D5A57] data-[state=checked]:border-[#2D5A57] data-[state=checked]:bg-[#2D5A57] data-[state=checked]:text-white'

function OptionRow({
  selected,
  children,
  onClick,
}: {
  selected: boolean
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onClick()
            }
          }
          : undefined
      }
      className={cn(
        'flex items-center justify-between rounded-2xl border p-3 transition-colors',
        selected ? 'border-[#2D5A57] bg-[#F8FBFA]' : 'border-gray-100 bg-white'
      )}
    >
      {children}
    </div>
  )
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
  const totalPrice = unitPrice * quantity
  const discount = getProductDiscountPercent(product, promotions)

  const canAddToCart = () => {
    const requiredOptions = product.options?.filter((o) => o.required) || []
    return requiredOptions.every((option) =>
      selectedOptions.some((so) => so.optionId === option.id && so.choiceIds.length > 0)
    )
  }

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedOptions, notes || undefined)
    setQuantity(1)
    setSelectedOptions([])
    setNotes('')
  }

  const addToCartFooter = (
    <div className="mx-auto flex w-full max-w-lg items-center gap-3">
      <div
        className="inline-flex shrink-0 items-center overflow-hidden rounded-full"
        style={{ backgroundColor: COTY_QTY_BG }}
      >
        <button
          type="button"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          className="flex h-10 w-10 items-center justify-center text-[#2D5A57] disabled:opacity-40"
          aria-label="Quitar uno"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-[32px] px-1 text-center text-sm font-semibold text-[#2D5A57]">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity(quantity + 1)}
          className="flex h-10 w-10 items-center justify-center text-[#2D5A57]"
          aria-label="Agregar uno"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        disabled={!canAddToCart()}
        onClick={handleAdd}
        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold text-white shadow-md transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: COTY_TEAL }}
      >
        Agregar
        <span>{formatPrice(totalPrice)}</span>
      </button>
    </div>
  )

  return (
    <SimpleModal open onClose={onClose} title={product.name} footer={addToCartFooter}>
      <div className="space-y-5">
        <div className="relative mx-auto aspect-square w-full max-w-[200px] overflow-hidden rounded-2xl">
          <ProductImage src={product.image} alt={product.name} className="rounded-2xl" />
        </div>

        <div className="text-center">
          <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          {discount > 0 ? (
            <p className="mt-2 text-sm font-semibold text-[#2D5A57]">
              {formatPrice(unitPrice)}
              <span className="ml-2 font-normal text-muted-foreground line-through">{formatPrice(product.price)}</span>
              <span className="ml-2 rounded-full bg-[#EAB308] px-2 py-0.5 text-[10px] font-bold text-white">
                -{discount}%
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm font-semibold text-[#2D5A57]">{formatPrice(product.price)}</p>
          )}
        </div>

        {product.options?.map((option) => (
          <div key={option.id} className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-semibold text-[#053E38]">
                {option.name}
                {option.required ? <span className="ml-1 text-red-500">*</span> : null}
              </Label>
              {!option.required ? (
                <span className="text-xs text-muted-foreground">Opcional</span>
              ) : null}
            </div>

            {option.multiple ? (
              <div className="space-y-2">
                {option.choices.map((choice) => {
                  const isSelected = selectedOptions.some(
                    (so) => so.optionId === option.id && so.choiceIds.includes(choice.id)
                  )

                  return (
                    <OptionRow key={choice.id} selected={isSelected}>
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`${option.id}-${choice.id}`}
                          checked={isSelected}
                          className={OPTION_CONTROL_CLASS}
                          onCheckedChange={() => handleOptionChange(option.id, choice.id, true)}
                        />
                        <Label
                          htmlFor={`${option.id}-${choice.id}`}
                          className="cursor-pointer text-sm font-medium text-foreground"
                        >
                          {choice.name}
                        </Label>
                      </div>
                      {choice.priceModifier > 0 ? (
                        <span className="text-sm font-medium text-[#2D5A57]">
                          +{formatPrice(choice.priceModifier)}
                        </span>
                      ) : null}
                    </OptionRow>
                  )
                })}
              </div>
            ) : (
              <RadioGroup
                value={selectedOptions.find((so) => so.optionId === option.id)?.choiceIds[0] || ''}
                onValueChange={(value) => handleOptionChange(option.id, value, false)}
                className="gap-2"
              >
                {option.choices.map((choice) => {
                  const isSelected = selectedOptions.some(
                    (so) => so.optionId === option.id && so.choiceIds.includes(choice.id)
                  )

                  return (
                    <OptionRow
                      key={choice.id}
                      selected={isSelected}
                      onClick={() => handleOptionChange(option.id, choice.id, false)}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem
                          value={choice.id}
                          id={`${option.id}-${choice.id}`}
                          className={OPTION_CONTROL_CLASS}
                        />
                        <Label
                          htmlFor={`${option.id}-${choice.id}`}
                          className="cursor-pointer text-sm font-medium text-foreground"
                        >
                          {choice.name}
                        </Label>
                      </div>
                      {choice.priceModifier > 0 ? (
                        <span className="text-sm font-medium text-[#2D5A57]">
                          +{formatPrice(choice.priceModifier)}
                        </span>
                      ) : null}
                    </OptionRow>
                  )
                })}
              </RadioGroup>
            )}
          </div>
        ))}

        <div className="space-y-2 mb-2">
          <Label className="text-sm font-semibold text-[#053E38]">Notas especiales</Label>
          <Textarea
            placeholder="Ej: Sin azúcar, extra caliente..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="resize-none rounded-2xl border-gray-100 bg-[#F8FBFA] focus-visible:border-[#2D5A57] focus-visible:ring-[#C5DDD9]/50"
          />
        </div>
      </div>
    </SimpleModal>
  )
}
