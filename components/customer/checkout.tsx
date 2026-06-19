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
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SimpleModal } from '@/components/ui/simple-modal'
import { useCart, useBusiness, useCatalog, useOrders, useTableSession } from '@/lib/store'
import { buildMenuPathWithTable } from '@/lib/menu-url'
import { TableSessionBanner } from '@/components/customer/table-session-banner'
import { useCartPricing } from '@/hooks/use-cart-pricing'
import { CartProductCard } from '@/components/customer/cart-product-card'
import { CheckoutFormSkeleton, CheckoutLoadingSkeleton, LoadingSkeleton } from '@/components/shared/loading'
import { COTY_HEADER, COTY_QTY_BG, COTY_TEAL, formatPrice } from '@/lib/coty-theme'
import { buildWhatsAppUrl } from '@/lib/whatsapp-message'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { cn } from '@/lib/utils'
import type { OrderType, PaymentMethod, Order } from '@/lib/types'
import { toast } from 'sonner'
import Image from 'next/image'

function CheckoutHeader() {
  return (
    <div
      className="w-full rounded-b-4xl md:rounded-b-[2.5rem]"
      style={{ backgroundColor: COTY_HEADER }}
    >
      <header className="mx-auto max-w-lg px-4 pb-14 pt-10 text-center md:max-w-4xl md:pb-12 md:pt-12 lg:max-w-6xl">
        <h1 className="text-xl font-bold text-white md:text-2xl">Mi pedido</h1>
        <p className="mt-1 text-sm text-white/80 md:text-base">
          Revisá tu orden antes de confirmar
        </p>
      </header>
    </div>
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
        'relative z-10 mx-auto w-full max-w-lg px-4 md:max-w-4xl md:px-6 lg:max-w-6xl lg:px-8',
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
  const { items, hydrated, updateQuantity, removeItem, clearCart } = useCart()
  const { settings, isLoading: isSettingsLoading } = useBusiness()
  const { promotions, channelAvailability, deliveryZones } = useCatalog()
  const { subtotal, discount, total } = useCartPricing(items, promotions)
  const { addOrder } = useOrders()
  const { tableSession, isTableMode, hydrated: tableSessionHydrated } = useTableSession()
  const { isOffline } = useOnlineStatus()

  const [orderType, setOrderType] = useState<OrderType>('pickup')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [deliveryZoneId, setDeliveryZoneId] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [tip, setTip] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isEmpty = items.length === 0 && !orderComplete
  const activeOrderType = isTableMode ? 'table' : orderType
  const selectedZone = deliveryZones.find((zone) => zone.id === deliveryZoneId)
  const deliveryFee =
    activeOrderType === 'delivery'
      ? selectedZone?.deliveryFee ?? settings.deliveryFee
      : 0
  const minOrderAmount =
    activeOrderType === 'delivery' && selectedZone
      ? Math.max(settings.minOrderAmount, selectedZone.minOrderAmount)
      : settings.minOrderAmount
  const finalTotal = Math.max(0, total - couponDiscount) + deliveryFee + tip
  const channelKey = activeOrderType === 'delivery' ? 'delivery' : activeOrderType === 'pickup' ? 'pickup' : 'local'
  const channelStatus = activeOrderType === 'table' ? { open: true } : channelAvailability?.[channelKey]
  const isClosed =
    activeOrderType !== 'table' &&
    (channelStatus ? !channelStatus.open : !settings.isOpen)
  const closedMessage =
    channelStatus?.reason ??
    `El local está cerrado. Horario: ${settings.openTime} – ${settings.closeTime}`
  const belowMinOrder = activeOrderType !== 'table' && minOrderAmount > 0 && subtotal < minOrderAmount
  const menuHref = tableSession ? buildMenuPathWithTable(tableSession.tableId) : '/menu'

  useEffect(() => {
    if (!tableSessionHydrated) return
    if (tableSession) {
      setOrderType('table')
      setPaymentMethod((current) => (current === 'mercado_pago' ? 'cash' : current))
      return
    }
    setOrderType((current) => (current === 'table' ? 'pickup' : current))
  }, [tableSession, tableSessionHydrated])

  useEffect(() => {
    if (items.length === 0) {
      setConfirmOpen(false)
    }
  }, [items.length])

  useEffect(() => {
    setConfirmOpen(false)
  }, [pathname])

  const generateWhatsAppMessage = (order: Order) => {
    if (!settings.whatsapp) return null
    return buildWhatsAppUrl(settings.whatsapp, order, settings.name)
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal, paymentMethod }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Cupón inválido')
      setCouponDiscount(payload.amount)
      toast.success('Cupón aplicado')
    } catch (error) {
      setCouponDiscount(0)
      toast.error(error instanceof Error ? error.message : 'Cupón inválido')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isOffline && paymentMethod === 'mercado_pago') {
      toast.error('Mercado Pago requiere conexión a internet.')
      return
    }

    if (isClosed) {
      toast.error(closedMessage)
      return
    }

    if (!customerName || !customerPhone) {
      toast.error('Por favor completá todos los campos requeridos')
      return
    }

    if (orderType === 'delivery' && !isTableMode && !customerAddress) {
      toast.error('Por favor ingresá tu dirección de entrega')
      return
    }

    if (isTableMode && !tableSession) {
      toast.error('No se pudo identificar la mesa')
      return
    }

    if (belowMinOrder) {
      toast.error(`El pedido mínimo es de ${formatPrice(minOrderAmount)}`)
      return
    }

    setIsSubmitting(true)

    try {
      const createdOrder = await addOrder({
        type: activeOrderType,
        paymentMethod: isTableMode && paymentMethod === 'mercado_pago' ? 'cash' : paymentMethod,
        customerName,
        customerPhone,
        customerAddress: activeOrderType === 'delivery' ? customerAddress : undefined,
        tableId: isTableMode ? tableSession?.tableId : undefined,
        deliveryZoneId: activeOrderType === 'delivery' && deliveryZoneId ? deliveryZoneId : undefined,
        discountCode: couponDiscount > 0 ? couponCode : undefined,
        tip: tip > 0 ? tip : undefined,
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

        const whatsappUrl = generateWhatsAppMessage(createdOrder)
        if (whatsappUrl) {
          window.open(whatsappUrl, '_blank')
        }

        clearCart()
        window.location.href = paymentOrder.paymentUrl ?? '/order-status'
        return
      }

      setOrderComplete(true)
      setConfirmOpen(false)
      clearCart()

      if (createdOrder.offlinePending || isOffline) {
        toast.success('Pedido guardado. Se enviará automáticamente al recuperar conexión.')
      }

      const whatsappUrl = generateWhatsAppMessage(createdOrder)
      if (whatsappUrl) {
        window.open(whatsappUrl, '_blank')
      }
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
          <div
            className="fixed bottom-[72px] left-0 right-0 z-40 px-4 md:bottom-8"
            style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto max-w-lg">
              <LoadingSkeleton className="h-14 w-full rounded-full" />
            </div>
          </div>
        </div>
      ) : isEmpty ? (
        <div className="coly-landing min-h-screen bg-white pb-24 md:pb-10">
          <CheckoutHeader />

          <CheckoutMain className="py-12 md:py-16">
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
              <Link href={menuHref} className="mt-8 w-full max-w-xs">
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
        <div className="coly-landing min-h-screen bg-white pb-24 md:pb-10">
          <CheckoutHeader />

          <CheckoutMain className="py-12 md:py-16">
            <div className="flex flex-col items-center text-center">
              <div
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                style={{ backgroundColor: COTY_QTY_BG }}
              >
                <Check className="h-10 w-10" style={{ color: COTY_TEAL }} />
              </div>
              <h2 className="text-2xl font-bold">¡Pedido confirmado!</h2>
              <p className="mt-2 text-muted-foreground">
                {isTableMode
                  ? `Tu pedido #${orderId} fue enviado a la Mesa ${tableSession?.tableNumber}`
                  : `Tu pedido #${orderId} ha sido enviado por WhatsApp`}
              </p>
              <div className="mt-6 w-full max-w-xs space-y-3">
                {!isTableMode ? (
                  <Link href="/order-status">
                    <Button className="w-full rounded-full py-6 font-bold" style={{ backgroundColor: COTY_TEAL }}>
                      Ver estado del pedido
                    </Button>
                  </Link>
                ) : null}
                <Link href={menuHref}>
                  <Button variant="outline" className="w-full rounded-full py-6 font-bold">
                    Hacer otro pedido
                  </Button>
                </Link>
              </div>
            </div>
          </CheckoutMain>
        </div>
      ) : (
        <div className="coly-landing min-h-screen bg-white pb-36 md:pb-24">
          <CheckoutHeader />

          <CheckoutMain className="pb-4 pt-6 md:pt-8">
            <TableSessionBanner className="mb-4" showClear={false} />
            {isClosed && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {closedMessage}
              </div>
            )}
            {belowMinOrder && !isClosed && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Pedido mínimo: {formatPrice(settings.minOrderAmount)}. Te faltan {formatPrice(settings.minOrderAmount - subtotal)}.
              </div>
            )}
            <div className="lg:grid lg:grid-cols-5 lg:items-start lg:gap-8">
              <div className="space-y-3 lg:col-span-3">
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
              </div>

              <div className="mt-3 lg:col-span-2 lg:mt-0 lg:sticky lg:top-24">
                {isSettingsLoading ? (
                  <CheckoutFormSkeleton />
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
                    <CheckoutSection
                      icon={<Image src="/icons/nota.svg" alt="Nota" width={17} height={17} />}
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
                      icon={
                        isTableMode ? (
                          <Users className="h-5 w-5 text-white" />
                        ) : (
                          <Image src="/icons/delivery.svg" alt="Delivery" width={22} height={22} />
                        )
                      }
                      title={isTableMode ? 'Pedido en mesa' : 'Método de entrega'}
                    >
                      {isTableMode ? (
                        <div className="mt-2 rounded-xl border border-black/8 bg-[#F8FBFA] px-3 py-3 text-sm">
                          <p className="font-medium text-[#2D5A57]">Mesa {tableSession?.tableNumber}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            El pedido llega al salón y podés seguir agregando productos durante tu visita.
                          </p>
                        </div>
                      ) : (
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
                            {deliveryFee > 0 && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                +{formatPrice(deliveryFee)}
                              </span>
                            )}
                          </label>
                        </RadioGroup>
                      )}
                      {!isTableMode && orderType === 'delivery' && deliveryZones.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          <Label className="text-xs">Zona de entrega</Label>
                          <RadioGroup
                            value={deliveryZoneId}
                            onValueChange={setDeliveryZoneId}
                            className="space-y-2"
                          >
                            {deliveryZones.map((zone) => (
                              <label key={zone.id} htmlFor={`zone-${zone.id}`} className="flex cursor-pointer items-center gap-2 text-sm">
                                <RadioGroupItem value={zone.id} id={`zone-${zone.id}`} />
                                <span>{zone.name}</span>
                                <span className="ml-auto text-xs text-muted-foreground">+{formatPrice(zone.deliveryFee)}</span>
                              </label>
                            ))}
                          </RadioGroup>
                        </div>
                      ) : null}
                    </CheckoutSection>

                    <div className="border-t border-black/8" />

                    <CheckoutSection
                      icon={<Image src="/icons/pedidos.svg" alt="Resumen" width={18} height={18} />}
                      title="Resumen del pedido"
                    >
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Productos</span>
                          <span className="font-medium">{formatPrice(subtotal + discount)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-emerald-700">
                            <span>Descuento promos</span>
                            <span className="font-medium">-{formatPrice(discount)}</span>
                          </div>
                        )}
                        {couponDiscount > 0 ? (
                          <div className="flex justify-between text-emerald-700">
                            <span>Cupón {couponCode}</span>
                            <span className="font-medium">-{formatPrice(couponDiscount)}</span>
                          </div>
                        ) : null}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Código de descuento"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="h-9"
                          />
                          <Button type="button" variant="outline" size="sm" onClick={() => void applyCoupon()}>
                            Aplicar
                          </Button>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{isTableMode ? 'Servicio' : 'Envío'}</span>
                          <span className="font-medium">{formatPrice(deliveryFee)}</span>
                        </div>
                        {!isTableMode ? (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Propina (opcional)</Label>
                            <div className="flex gap-2">
                              {[0, Math.round(total * 0.1), Math.round(total * 0.15)].map((value, index) => (
                                <Button
                                  key={index}
                                  type="button"
                                  size="sm"
                                  variant={tip === value ? 'default' : 'outline'}
                                  onClick={() => setTip(value)}
                                >
                                  {index === 0 ? 'Sin propina' : formatPrice(value)}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {tip > 0 ? (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Propina</span>
                            <span className="font-medium">{formatPrice(tip)}</span>
                          </div>
                        ) : null}
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
              </div>
            </div>
          </CheckoutMain>

          <div
            className="fixed bottom-[72px] left-0 right-0 z-40 px-4 md:bottom-8"
            style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto max-w-lg md:max-w-md md:ml-auto md:mr-8 lg:mr-12">
              {isSettingsLoading ? (
                <LoadingSkeleton className="h-14 w-full rounded-full" />
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={isClosed || belowMinOrder}
                  className="flex w-full items-center justify-between rounded-full px-6 py-4 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
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
              {orderType === 'delivery' && !isTableMode && (
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
                    ...(isTableMode
                      ? []
                      : [{ value: 'mercado_pago' as const, label: 'Mercado Pago', icon: CreditCard }]),
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
