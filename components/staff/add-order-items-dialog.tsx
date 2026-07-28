'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { ProductDetailModal } from '@/components/customer/product-detail-modal'
import { formatPrice } from '@/lib/coty-theme'
import {
  PANEL_INTERACTIVE_HOVER,
  PANEL_OUTLINE_BTN,
  PANEL_PRIMARY_BTN,
  PANEL_SURFACE,
} from '@/lib/panel-theme'
import { useCatalog } from '@/lib/store'
import type { CartItem, Product, SelectedOption } from '@/lib/types'
import { cn } from '@/lib/utils'

export type AddOrderItemsPayload = Array<{
  productId: string
  quantity: number
  selectedOptions: SelectedOption[]
  notes?: string
}>

type AddOrderItemsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (items: AddOrderItemsPayload) => Promise<void>
  orderLabel?: string
}

export function AddOrderItemsDialog({
  open,
  onOpenChange,
  onSubmit,
  orderLabel,
}: AddOrderItemsDialogProps) {
  const { products: catalogProducts, isLoading: catalogLoading } = useCatalog()
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingItems, setPendingItems] = useState<CartItem[]>([])
  const [productPicker, setProductPicker] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const available = catalogProducts.filter((product) => product.available !== false)
    if (!query) return []
    return available.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        (product.description?.toLowerCase().includes(query) ?? false)
    )
  }, [catalogProducts, searchQuery])

  const cartTotal = useMemo(
    () =>
      pendingItems.reduce((sum, item) => {
        const optionsTotal = item.selectedOptions.reduce((optSum, option) => {
          const productOption = item.product.options?.find((entry) => entry.id === option.optionId)
          const choiceTotal =
            productOption?.choices
              .filter((choice) => option.choiceIds.includes(choice.id))
              .reduce((choiceSum, choice) => choiceSum + (choice.priceModifier ?? 0), 0) ?? 0
          return optSum + choiceTotal
        }, 0)
        return sum + (item.product.price + optionsTotal) * item.quantity
      }, 0),
    [pendingItems]
  )

  const reset = () => {
    setSearchQuery('')
    setPendingItems([])
    setProductPicker(null)
  }

  const handleAddProduct = (
    product: Product,
    quantity: number,
    selectedOptions: SelectedOption[],
    itemNotes?: string
  ) => {
    setPendingItems((previous) => [
      ...previous,
      {
        id: `add-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        product,
        quantity,
        selectedOptions,
        notes: itemNotes,
      },
    ])
    toast.success(`${product.name} agregado`)
  }

  const handleSubmit = async () => {
    if (pendingItems.length === 0) {
      toast.error('Agregá al menos un producto')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(
        pendingItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          notes: item.notes,
        }))
      )
      toast.success('Productos sumados al pedido')
      reset()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo editar el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={(next) => {
          if (!next) reset()
          onOpenChange(next)
        }}
        title="Agregar productos"
        description={
          orderLabel
            ? `Sumá ítems al pedido ${orderLabel} (por ejemplo, si el cliente pidió algo por WhatsApp).`
            : 'Sumá ítems al pedido activo.'
        }
        maxWidthClassName="sm:max-w-lg"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className={PANEL_OUTLINE_BTN} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              className={PANEL_PRIMARY_BTN}
              disabled={submitting || pendingItems.length === 0}
              onClick={() => void handleSubmit()}
            >
              {submitting ? (
                <>
                  <Spinner className="mr-2" />
                  Guardando...
                </>
              ) : (
                `Sumar al pedido${pendingItems.length ? ` (${pendingItems.length})` : ''}`
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-44 rounded-lg border">
            <div className="space-y-1 p-2">
              {catalogLoading && catalogProducts.length === 0 ? (
                <div className="flex justify-center py-6">
                  <Spinner />
                </div>
              ) : searchQuery.trim().length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  Escribí el nombre del producto para buscar
                </p>
              ) : filteredProducts.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  Sin resultados para &ldquo;{searchQuery.trim()}&rdquo;
                </p>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm',
                      PANEL_INTERACTIVE_HOVER
                    )}
                    onClick={() => {
                      if (product.options?.length) {
                        setProductPicker(product)
                        return
                      }
                      handleAddProduct(product, 1, [])
                    }}
                  >
                    <span>{product.name}</span>
                    <span className="text-xs text-muted-foreground">{formatPrice(product.price)}</span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          {pendingItems.length > 0 ? (
            <div className={cn('rounded-lg border p-3 text-sm', PANEL_SURFACE)}>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium">Para sumar ({pendingItems.length})</p>
                <p className="font-semibold text-primary">{formatPrice(cartTotal)}</p>
              </div>
              {pendingItems.map((item) => (
                <div key={item.id} className="flex justify-between gap-2 py-1">
                  <span>
                    {item.quantity}x {item.product.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-destructive"
                    onClick={() =>
                      setPendingItems((previous) => previous.filter((entry) => entry.id !== item.id))
                    }
                  >
                    Quitar
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </ResponsiveModal>

      {productPicker ? (
        <ProductDetailModal
          product={productPicker}
          onClose={() => setProductPicker(null)}
          onAddToCart={(product, quantity, selectedOptions, itemNotes) => {
            handleAddProduct(product, quantity, selectedOptions, itemNotes)
            setProductPicker(null)
          }}
        />
      ) : null}
    </>
  )
}
