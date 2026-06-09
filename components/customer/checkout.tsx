'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  Bike,
  ShoppingCart,
  ShoppingBag,
  ArrowRight,
  Check,
  User,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SimpleModal } from '@/components/ui/simple-modal'
import { useCart, useBusiness, useOrders } from '@/lib/store'
import { CartProductCard } from '@/components/customer/cart-product-card'
import { CheckoutFormSkeleton, CheckoutLoadingSkeleton, LoadingSkeleton } from '@/components/shared/loading'
import { COTY_HEADER, COTY_QTY_BG, COTY_TEAL, formatPrice } from '@/lib/coty-theme'
import { cn } from '@/lib/utils'
import type { OrderType, PaymentMethod, Order } from '@/lib/types'
import { toast } from 'sonner'

function CheckoutHeader() {
  return (
    <header
      className="mx-auto max-w-lg rounded-b-4xl px-4 pb-14 pt-10 text-center md:rounded-b-[2.5rem]"
      style={{ backgroundColor: COTY_HEADER }}
    >
      <h1 className="text-xl font-bold text-white md:text-2xl">Mi pedido</h1>
      <p className="mt-1 text-sm text-white/80">Revisá tu orden antes de confirmar</p>
    </header>
  )
}

function CheckoutMain({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <main
      className={cn(
        'relative z-10 mx-auto -mt-10 max-w-lg rounded-t-[1.75rem] bg-white px-4 md:rounded-t-4xl',
        className
      )}
    >
      {children}
    </main>
  )
}

function CheckoutSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3 p-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: COTY_HEADER }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-foreground">{title}</div>
        {children}
      </div>
    </div>
  )
}

export function CheckoutPage() {
  const pathname = usePathname()
  const { items, total, hydrated, updateQuantity, removeItem, clearCart } = useCart()
  const { settings, isLoading: isSettingsLoading } = useBusiness()
  const { addOrder } = useOrders()

  const [orderType, setOrderType] = useState<OrderType>('pickup')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isEmpty = items.length === 0 && !orderComplete
  const deliveryFee = orderType === 'delivery' ? settings.deliveryFee : 0
  const finalTotal = total + deliveryFee

  useEffect(() => {
    if (items.length === 0) {
      setConfirmOpen(false)
    }
  }, [items.length])

  useEffect(() => {
    setConfirmOpen(false)
  }, [pathname])

  const generateWhatsAppMessage = (order: Order) => {
    const itemsList = order.items
      .map((item) => {
        const options = item.selectedOptions
          ?.map((opt) => {
            const productOpt = item.product.options?.find((o) => o.id === opt.optionId)
            return opt.choiceIds
              .map((cId) => productOpt?.choices.find((c) => c.id === cId)?.name)
              .join(', ')
          })
          .join(' | ')
        return `• ${item.quantity}x ${item.product.name}${options ? ` (${options})` : ''}`
      })
      .join('\n')

    const message = `🧾 *Nuevo Pedido - ${settings.name}*

📋 *Pedido #${order.id}*
👤 *Cliente:* ${order.customerName}
📱 *Teléfono:* ${order.customerPhone}
${order.type === 'delivery' ? `📍 *Dirección:* ${order.customerAddress}\n` : ''}
🛒 *Productos:*
${itemsList}

💰 *Total:* $${order.total.toFixed(2)}
💳 *Pago:* ${paymentMethod === 'cash'
        ? 'Efectivo'
        : paymentMethod === 'card'
          ? 'Tarjeta'
          : paymentMethod === 'transfer'
            ? 'Transferencia'
            : 'Mercado Pago'
      }
${order.type === 'delivery' ? '🚚 *Tipo:* Delivery' : '🏪 *Tipo:* Recoger en tienda'}
${order.notes ? `\n📝 *Notas:* ${order.notes}` : ''}`

    return encodeURIComponent(message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName || !customerPhone) {
      toast.error('Por favor completá todos los campos requeridos')
      return
    }

    if (orderType === 'delivery' && !customerAddress) {
      toast.error('Por favor ingresá tu dirección de entrega')
      return
    }

    setIsSubmitting(true)

    try {
      const createdOrder = await addOrder({
        type: orderType,
        paymentMethod,
        customerName,
        customerPhone,
        customerAddress: orderType === 'delivery' ? customerAddress : undefined,
        notes: notes || undefined,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          notes: item.notes,
        })),
      })

      setOrderId(createdOrder.displayCode ?? createdOrder.id)

      if (paymentMethod === 'mercado_pago') {
        const paymentOrder = await fetch('/api/payments/mercadopago/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: createdOrder.id }),
        }).then(async (response) => {
          const payload = await response.json()
          if (!response.ok) {
            throw new Error(payload?.error ?? 'No se pudo iniciar el pago online')
          }
          return payload as Order
        })

        clearCart()
        window.location.href = paymentOrder.paymentUrl ?? '/order-status'
        return
      }

      setOrderComplete(true)
      setConfirmOpen(false)
      clearCart()

      const whatsappUrl = `https://wa.me/${settings.whatsapp}?text=${generateWhatsAppMessage(createdOrder)}`
      window.open(whatsappUrl, '_blank')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo procesar el pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {!hydrated ? (
        <div className="coly-landing min-h-screen bg-white pb-36">
          <CheckoutHeader />
          <CheckoutMain className="space-y-3 pb-4 pt-2">
            <CheckoutLoadingSkeleton />
          </CheckoutMain>
          <div className="fixed bottom-[72px] left-0 right-0 z-40 px-4">
            <div className="mx-auto max-w-lg">
              <LoadingSkeleton className="h-14 w-full rounded-full" />
            </div>
          </div>
        </div>
      ) : isEmpty ? (
        <div className="coly-landing min-h-screen bg-white pb-24">
          <CheckoutHeader />

          <CheckoutMain className="py-12">
            <div className="flex flex-col items-center text-center">
              <div
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                style={{ backgroundColor: COTY_QTY_BG }}
              >
                <ShoppingBag className="h-10 w-10" style={{ color: COTY_TEAL }} strokeWidth={1.75} />
              </div>
              <h2 className="text-xl font-bold text-foreground">Carrito vacío</h2>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Todavía no agregaste productos. Explorá el menú y armá tu pedido.
              </p>
              <Link href="/menu" className="mt-8 w-full max-w-xs">
                <Button
                  className="w-full rounded-full py-6 text-base font-bold shadow-lg"
                  style={{ backgroundColor: COTY_TEAL }}
                >
                  Ver menú
                </Button>
              </Link>
            </div>
          </CheckoutMain>
        </div>
      ) : orderComplete ? (
        <div className="coly-landing min-h-screen bg-white pb-24">
          <CheckoutHeader />

          <CheckoutMain className="py-12">
            <div className="flex flex-col items-center text-center">
              <div
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                style={{ backgroundColor: COTY_QTY_BG }}
              >
                <Check className="h-10 w-10" style={{ color: COTY_TEAL }} />
              </div>
              <h2 className="text-2xl font-bold">¡Pedido confirmado!</h2>
              <p className="mt-2 text-muted-foreground">
                Tu pedido #{orderId} ha sido enviado por WhatsApp
              </p>
              <div className="mt-6 w-full max-w-xs space-y-3">
                <Link href="/order-status">
                  <Button className="w-full rounded-full py-6 font-bold" style={{ backgroundColor: COTY_TEAL }}>
                    Ver estado del pedido
                  </Button>
                </Link>
                <Link href="/menu">
                  <Button variant="outline" className="w-full rounded-full py-6 font-bold">
                    Hacer otro pedido
                  </Button>
                </Link>
              </div>
            </div>
          </CheckoutMain>
        </div>
      ) : (
        <div className="coly-landing min-h-screen bg-white pb-36">
          <CheckoutHeader />

          <CheckoutMain className="space-y-3 pb-4 pt-2">
            {items.map((item, index) => (
              <CartProductCard
                key={item.id}
                item={item}
                index={index}
                variant="cart"
                onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                onRemove={() => removeItem(item.id)}
              />
            ))}

            {isSettingsLoading ? (
              <CheckoutFormSkeleton />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
                <CheckoutSection
                  icon={<MessageSquare className="h-5 w-5 text-white" />}
                  title={
                    <>
                      Nota para el local{' '}
                      <span className="text-sm font-normal text-muted-foreground">(Opcional)</span>
                    </>
                  }
                >
                  <Textarea
                    placeholder="Ej: Sin cebolla, sin tomate, retirar a las 21 hs"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="mt-2 resize-none rounded-none border-0 bg-transparent p-0 text-sm shadow-none placeholder:text-gray-40 placeholder:px-1 focus-visible:ring-0"
                  />
                </CheckoutSection>

                <div className="border-t border-black/8" />

                <CheckoutSection
                  icon={<Bike className="h-5 w-5 text-white" />}
                  title="Método de entrega"
                >
                  <RadioGroup
                    value={orderType}
                    onValueChange={(v) => setOrderType(v as OrderType)}
                    className="mt-2 space-y-3"
                  >
                    <label htmlFor="pickup" className="flex cursor-pointer items-center gap-3">
                      <RadioGroupItem
                        value="pickup"
                        id="pickup"
                        className="border-[#2D5A57] text-[#2D5A57] data-[state=checked]:border-[#2D5A57]"
                      />
                      <span className="text-sm font-medium">Retiro en el local</span>
                      <span
                        className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold text-[#2D5A57]"
                        style={{ backgroundColor: COTY_QTY_BG }}
                      >
                        Gratis
                      </span>
                    </label>
                    <label htmlFor="delivery" className="flex cursor-pointer items-center gap-3">
                      <RadioGroupItem
                        value="delivery"
                        id="delivery"
                        className="border-[#2D5A57] text-[#2D5A57]"
                      />
                      <span className="text-sm font-medium">Delivery</span>
                      {settings.deliveryFee > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          +{formatPrice(settings.deliveryFee)}
                        </span>
                      )}
                    </label>
                  </RadioGroup>
                </CheckoutSection>

                <div className="border-t border-black/8" />

                <CheckoutSection
                  icon={<ShoppingCart className="h-5 w-5 text-white" />}
                  title="Resumen del pedido"
                >
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Productos</span>
                      <span className="font-medium">{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Envío</span>
                      <span className="font-medium">{formatPrice(deliveryFee)}</span>
                    </div>
                    <div className="my-2 border-t border-black/8" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Total</span>
                      <span className="text-xl font-bold" style={{ color: COTY_TEAL }}>
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                  </div>
                </CheckoutSection>
              </div>
            )}
          </CheckoutMain>

          <div className="fixed bottom-[72px] left-0 right-0 z-40 px-4">
            <div className="mx-auto max-w-lg">
              {isSettingsLoading ? (
                <LoadingSkeleton className="h-14 w-full rounded-full" />
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="flex w-full items-center justify-between rounded-full px-6 py-4 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-95"
                  style={{ backgroundColor: '#053E38' }}
                >
                  <span className="flex-1 text-center">Confirmar pedido</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
                    <ArrowRight className="h-5 w-5" style={{ color: COTY_TEAL }} />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmOpen && !isEmpty && !orderComplete && (
        <SimpleModal open onClose={() => setConfirmOpen(false)} title="Datos para confirmar" className="max-w-md rounded-2xl">
          <div className="overflow-y-auto p-4 pt-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nombre *
                </Label>
                <Input
                  id="name"
                  placeholder="Tu nombre"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+54 11 1234 5678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
              </div>
              {orderType === 'delivery' && (
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Dirección *
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Calle, número, referencias..."
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    rows={2}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Método de pago
                </Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                  className="space-y-2"
                >
                  {[
                    { value: 'cash', label: 'Efectivo', icon: Banknote },
                    { value: 'card', label: 'Tarjeta (al recibir)', icon: CreditCard },
                    { value: 'transfer', label: 'Transferencia', icon: Building2 },
                    { value: 'mercado_pago', label: 'Mercado Pago', icon: CreditCard },
                  ].map(({ value, label, icon: Icon }) => (
                    <label
                      key={value}
                      htmlFor={`pay-${value}`}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/8 p-3"
                    >
                      <RadioGroupItem value={value} id={`pay-${value}`} />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <Button
                type="submit"
                className="w-full rounded-full py-5 font-bold"
                style={{ backgroundColor: COTY_TEAL }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Procesando...' : 'Confirmar y enviar'}
              </Button>
            </form>
          </div>
        </SimpleModal>
      )}
    </>
  )
}
