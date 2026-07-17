'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Phone, Search, Store, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { ProductDetailModal } from '@/components/customer/product-detail-modal'
import { formatPrice } from '@/lib/coty-theme'
import { PAYMENT_METHOD_LABELS } from '@/lib/order-labels'
import {
  PANEL_INTERACTIVE_HOVER,
  PANEL_OUTLINE_BTN,
  PANEL_PRIMARY_BTN,
  PANEL_SURFACE,
} from '@/lib/panel-theme'
import { useCatalog } from '@/lib/store'
import type { CartItem, PaymentMethod, Product, SelectedOption } from '@/lib/types'
import { cn } from '@/lib/utils'

export type ManualOrderSource = 'phone' | 'walk_in'
export type ManualOrderType = 'delivery' | 'pickup'

export type ManualOrderSubmitPayload = {
  type: ManualOrderType
  source: ManualOrderSource
  paymentMethod: Exclude<PaymentMethod, 'mercado_pago'>
  customerName: string
  customerPhone: string
  customerAddress?: string
  deliveryZoneId?: string
  notes?: string
  items: Array<{
    productId: string
    quantity: number
    selectedOptions: SelectedOption[]
    notes?: string
  }>
}

type ManualOrderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: ManualOrderSubmitPayload) => Promise<void>
}

const STAFF_PAYMENT_METHODS: Array<Exclude<PaymentMethod, 'mercado_pago'>> = ['cash', 'card', 'transfer']

export function ManualOrderDialog({ open, onOpenChange, onSubmit }: ManualOrderDialogProps) {
  const { products: catalogProducts, deliveryZones, isLoading: catalogLoading } = useCatalog()
  const [source, setSource] = useState<ManualOrderSource>('phone')
  const [orderType, setOrderType] = useState<ManualOrderType>('pickup')
  const [paymentMethod, setPaymentMethod] = useState<Exclude<PaymentMethod, 'mercado_pago'>>('cash')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [deliveryZoneId, setDeliveryZoneId] = useState('')
  const [notes, setNotes] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [orderItems, setOrderItems] = useState<CartItem[]>([])
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
      orderItems.reduce((sum, item) => {
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
    [orderItems]
  )

  const reset = () => {
    setSource('phone')
    setOrderType('pickup')
    setPaymentMethod('cash')
    setCustomerName('')
    setCustomerPhone('')
    setCustomerAddress('')
    setDeliveryZoneId('')
    setNotes('')
    setSearchQuery('')
    setOrderItems([])
    setProductPicker(null)
  }

  const handleAddProduct = (
    product: Product,
    quantity: number,
    selectedOptions: SelectedOption[],
    itemNotes?: string
  ) => {
    setOrderItems((previous) => [
      ...previous,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        product,
        quantity,
        selectedOptions,
        notes: itemNotes,
      },
    ])
    toast.success(`${product.name} agregado`)
  }

  const handleSourceChange = (next: ManualOrderSource) => {
    setSource(next)
    if (next === 'walk_in') {
      setOrderType('pickup')
    }
  }

  const handleSubmit = async () => {
    if (orderItems.length === 0) {
      toast.error('Agregá al menos un producto')
      return
    }

    if (source === 'phone' && customerName.trim().length < 2) {
      toast.error('Indicá el nombre del cliente')
      return
    }

    if (source === 'phone' && customerPhone.trim().length < 3) {
      toast.error('Indicá el teléfono del cliente')
      return
    }

    if (orderType === 'delivery' && customerAddress.trim().length < 3) {
      toast.error('Indicá la dirección de entrega')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        type: orderType,
        source,
        paymentMethod,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: orderType === 'delivery' ? customerAddress.trim() : undefined,
        deliveryZoneId: orderType === 'delivery' && deliveryZoneId ? deliveryZoneId : undefined,
        notes: notes.trim() || undefined,
        items: orderItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          notes: item.notes,
        })),
      })
      toast.success('Pedido cargado en el sistema')
      reset()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar el pedido')
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
        title="Nuevo pedido manual"
        description="Para clientes por teléfono o que compran en el local."
        maxWidthClassName="sm:max-w-xl"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className={PANEL_OUTLINE_BTN} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              className={cn(PANEL_PRIMARY_BTN)}
              disabled={submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? 'Guardando…' : 'Cargar pedido'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSourceChange('phone')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors',
                source === 'phone'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted/50'
              )}
            >
              <Phone className="h-4 w-4" />
              Teléfono
            </button>
            <button
              type="button"
              onClick={() => handleSourceChange('walk_in')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors',
                source === 'walk_in'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted/50'
              )}
            >
              <Store className="h-4 w-4" />
              En el local
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOrderType('pickup')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                orderType === 'pickup'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted/50'
              )}
            >
              <Store className="h-4 w-4" />
              Retiro
            </button>
            <button
              type="button"
              onClick={() => setOrderType('delivery')}
              disabled={source === 'walk_in'}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                orderType === 'delivery'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted/50',
                source === 'walk_in' && 'cursor-not-allowed opacity-50'
              )}
            >
              <Truck className="h-4 w-4" />
              Delivery
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="manual-customer-name">
                Nombre{source === 'walk_in' ? ' (opcional)' : ''}
              </Label>
              <Input
                id="manual-customer-name"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder={source === 'walk_in' ? 'Cliente mostrador' : 'Nombre del cliente'}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-customer-phone">
                Teléfono{source === 'walk_in' ? ' (opcional)' : ''}
              </Label>
              <Input
                id="manual-customer-phone"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder={source === 'walk_in' ? 'Opcional' : 'Ej: 11 1234 5678'}
                inputMode="tel"
              />
            </div>
          </div>

          {orderType === 'delivery' ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="manual-customer-address">Dirección</Label>
                <Input
                  id="manual-customer-address"
                  value={customerAddress}
                  onChange={(event) => setCustomerAddress(event.target.value)}
                  placeholder="Calle, número, barrio…"
                />
              </div>
              {deliveryZones.length > 0 ? (
                <div className="space-y-1.5">
                  <Label>Zona de delivery</Label>
                  <Select value={deliveryZoneId} onValueChange={setDeliveryZoneId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar zona (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryZones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name} · {formatPrice(zone.deliveryFee)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label>Forma de pago</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as Exclude<PaymentMethod, 'mercado_pago'>)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAFF_PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-40 rounded-lg border">
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

          {orderItems.length > 0 ? (
            <div className={cn('rounded-lg border p-3 text-sm', PANEL_SURFACE)}>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium">Pedido ({orderItems.length})</p>
                <p className="font-semibold text-primary">{formatPrice(cartTotal)}</p>
              </div>
              {orderItems.map((item) => (
                <div key={item.id} className="flex justify-between gap-2 py-1">
                  <span>
                    {item.quantity}x {item.product.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-destructive"
                    onClick={() =>
                      setOrderItems((previous) => previous.filter((entry) => entry.id !== item.id))
                    }
                  >
                    Quitar
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="manual-notes">Notas (opcional)</Label>
            <Textarea
              id="manual-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ej: sin cebolla, entregar después de las 20…"
              rows={2}
            />
          </div>
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
