'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  User,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  Building2,
  Users,
  Armchair,
  Info,
  Crosshair,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SimpleModal } from '@/components/ui/simple-modal'
import { TransferPaymentDetails } from '@/components/customer/transfer-payment-details'
import { useCart, useBusiness, useCatalog, useOrders, useTableSession, rememberOrderTracking } from '@/lib/store'
import {
  buildCleanUrlWithoutMpReturn,
  buildOrderStatusReturnUrl,
  getMpPendingOrder,
  markMpRedirecting,
  markMpReturnHandled,
  rememberMpPendingOrder,
  resetMpCheckoutFlow,
  shouldRedirectCheckoutToOrderStatus,
  wasMpReturnAlreadyHandled,
} from '@/lib/mercadopago-return'
import { buildMenuPathWithTable } from '@/lib/menu-url'
import { TableSessionBanner } from '@/components/customer/table-session-banner'
import { useCartPricing } from '@/hooks/use-cart-pricing'
import { CartProductCard } from '@/components/customer/cart-product-card'
import { OrderConfirmationView } from '@/components/customer/order-confirmation'
import { CheckoutFormSkeleton, CheckoutLoadingSkeleton, LoadingSkeleton } from '@/components/shared/loading'
import { COTY_HEADER, COTY_MINT, COTY_QTY_BG, COTY_TEAL, formatPrice, LOGO_SRC_SVG } from '@/lib/coty-theme'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { cn } from '@/lib/utils'
import type { OrderType, PaymentMethod, Order } from '@/lib/types'
import { toast } from 'sonner'
import Image from 'next/image'

function CheckoutHeader({
  tableNumber,
  backHref,
}: {
  tableNumber?: number
  backHref?: string
}) {
  if (tableNumber != null) {
    return (
      <div className="w-full" style={{ backgroundColor: COTY_HEADER }}>
        <header className="relative mx-auto flex max-w-lg items-center justify-between px-4 py-4 md:max-w-4xl lg:max-w-6xl">
          <Link
            href={backHref ?? '/menu'}
            className="flex h-9 w-9 items-center justify-center text-white"
            aria-label="Volver al menú"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <img
              src={LOGO_SRC_SVG}
              alt="Coty Café"
              className="h-10 w-auto object-contain mix-blend-screen"
            />
          </Link>

          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ backgroundColor: COTY_MINT }}
          >
            <Armchair className="h-3.5 w-3.5" style={{ color: COTY_HEADER }} strokeWidth={2} />
            <span className="text-xs font-semibold" style={{ color: COTY_HEADER }}>
              Mesa {tableNumber}
            </span>
          </div>
        </header>
      </div>
    )
  }

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

function TableOrderTitle({ tableNumber }: { tableNumber: number }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: COTY_HEADER }}
      >
        <Users className="h-5 w-5 text-white" />
      </div>
      <h1 className="text-lg font-bold text-foreground md:text-xl">Tu pedido — Mesa {tableNumber}</h1>
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items, hydrated, updateQuantity, removeItem, clearCart } = useCart()
  const { settings, isLoading: isSettingsLoading } = useBusiness()
  const { promotions, channelAvailability, mercadoPagoAvailable } = useCatalog()
  const { subtotal, discount, total } = useCartPricing(items, promotions)
  const { addOrder } = useOrders()
  const { tableSession, isTableMode, hydrated: tableSessionHydrated } = useTableSession()
  const { isOffline } = useOnlineStatus()

  const [orderType, setOrderType] = useState<OrderType>('pickup')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [tip, setTip] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [completedOrderId, setCompletedOrderId] = useState('')
  const [completedTableId, setCompletedTableId] = useState<string | undefined>()
  const [completedTableNumber, setCompletedTableNumber] = useState<number | undefined>()
  const [completedWhatsappUrl, setCompletedWhatsappUrl] = useState<string | undefined>()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locatingAddress, setLocatingAddress] = useState(false)
  const redirectingToMpRef = useRef(false)
  const [redirectingToMp, setRedirectingToMp] = useState(false)
  const [pendingMpOrder, setPendingMpOrder] = useState<ReturnType<typeof getMpPendingOrder>>(null)
  const submitLockRef = useRef(false)

  const resetMpRedirectState = () => {
    redirectingToMpRef.current = false
    setRedirectingToMp(false)
    submitLockRef.current = false
    resetMpCheckoutFlow()
  }

  const showingMpRedirect = redirectingToMp
  const isEmpty = items.length === 0 && !orderComplete && !showingMpRedirect
  const activeOrderType = isTableMode ? 'table' : orderType
  const deliveryFee = activeOrderType === 'delivery' ? settings.deliveryFee : 0
  const minOrderAmount = settings.minOrderAmount
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
    const pending = getMpPendingOrder()
    setPendingMpOrder(pending)
    resetMpRedirectState()
  }, [])

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      resetMpRedirectState()
      setIsSubmitting(false)
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  useEffect(() => {
    if (!tableSessionHydrated) return
    if (tableSession) {
      setOrderType('table')
      setPaymentMethod('cash')
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

  useEffect(() => {
    if (shouldRedirectCheckoutToOrderStatus(searchParams)) {
      window.location.replace(buildOrderStatusReturnUrl(searchParams))
      return
    }

    if (searchParams.get('status') === 'failure') {
      const orderId = searchParams.get('orderId')
      const cleanUrl = buildCleanUrlWithoutMpReturn(pathname, searchParams)

      resetMpRedirectState()
      setIsSubmitting(false)

      if (!wasMpReturnAlreadyHandled(orderId, 'failure')) {
        markMpReturnHandled(orderId, 'failure')
        toast.error('El pago con Mercado Pago no se completó. Podés reintentar o elegir otro método.')
      }

      router.replace(cleanUrl)
    }
  }, [searchParams, pathname, router])

  useEffect(() => {
    if (!mercadoPagoAvailable && paymentMethod === 'mercado_pago') {
      setPaymentMethod('cash')
    }
  }, [mercadoPagoAvailable, paymentMethod])

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

  const useMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Tu navegador no permite geolocalización')
      return
    }

    setLocatingAddress(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        try {
          const response = await fetch('/api/delivery/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng }),
          })
          const data = await response.json()
          if (!response.ok) throw new Error(data.error ?? 'No se pudo obtener la dirección')

          // Siempre guardamos el GPS real del dispositivo (no el de Nominatim).
          setDeliveryCoords({ lat, lng })
          const suggestion = typeof data.displayName === 'string' ? data.displayName.trim() : ''
          if (suggestion) {
            setCustomerAddress(suggestion)
            toast.success(
              data.approximate
                ? 'Zona detectada. Completá el número de calle y referencias.'
                : 'Ubicación cargada. Revisá que la dirección sea correcta.'
            )
          } else {
            setCustomerAddress('')
            toast.message('Ubicación guardada. Escribí tu dirección completa.')
          }
        } catch (error) {
          setDeliveryCoords({ lat, lng })
          toast.error(
            error instanceof Error
              ? error.message
              : 'No se pudo obtener la dirección. Completala manualmente.'
          )
        } finally {
          setLocatingAddress(false)
        }
      },
      () => {
        setLocatingAddress(false)
        toast.error('No se pudo obtener tu ubicación. Revisá los permisos del navegador.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting || submitLockRef.current) return

    if (isOffline && paymentMethod === 'mercado_pago') {
      toast.error('Mercado Pago requiere conexión a internet.')
      return
    }

    if (isClosed) {
      toast.error(closedMessage)
      return
    }

    if (!isTableMode && (!customerName || !customerPhone)) {
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
    submitLockRef.current = true

    try {
      const createdOrder = await addOrder({
        type: activeOrderType,
        paymentMethod: isTableMode && paymentMethod === 'mercado_pago' ? 'cash' : paymentMethod,
        customerName: isTableMode ? `Mesa ${tableSession?.tableNumber}` : customerName,
        customerPhone: isTableMode ? 'mesa' : customerPhone,
        customerAddress: activeOrderType === 'delivery' ? customerAddress : undefined,
        deliveryLat: activeOrderType === 'delivery' && deliveryCoords ? deliveryCoords.lat : undefined,
        deliveryLng: activeOrderType === 'delivery' && deliveryCoords ? deliveryCoords.lng : undefined,
        tableId: isTableMode ? tableSession?.tableId : undefined,
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

      setCompletedOrderId(createdOrder.id)
      setCompletedTableId(tableSession?.tableId)
      setCompletedTableNumber(tableSession?.tableNumber)
      setCompletedWhatsappUrl(createdOrder.whatsappCheckoutUrl)

      if (paymentMethod === 'mercado_pago') {
        if (!createdOrder.trackingProof) {
          throw new Error(
            'No se pudo iniciar Mercado Pago. Si tenés abierta la sesión del panel de staff, cerrala e intentá de nuevo.'
          )
        }

        redirectingToMpRef.current = true
        setRedirectingToMp(true)
        setConfirmOpen(false)

        const paymentOrder = await fetch('/api/payments/mercadopago/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: createdOrder.id,
            trackingProof: createdOrder.trackingProof,
          }),
        }).then(async (response) => {
          const payload = await response.json()
          if (!response.ok) {
            throw new Error(payload?.error ?? 'No se pudo iniciar el pago online')
          }
          return payload as Pick<Order, 'paymentUrl'>
        })

        const paymentUrl = paymentOrder.paymentUrl ?? buildOrderStatusReturnUrl(new URLSearchParams(), createdOrder.id)

        rememberMpPendingOrder({
          orderId: createdOrder.id,
          trackingProof: createdOrder.trackingProof,
          publicTrackingCode: createdOrder.publicTrackingCode,
          displayCode: createdOrder.displayCode,
        })
        rememberOrderTracking(createdOrder.publicTrackingCode, createdOrder.id, createdOrder.displayCode)
        markMpRedirecting()
        window.location.replace(paymentUrl)
        return
      }

      setOrderComplete(true)
      setConfirmOpen(false)
      clearCart()

      if (createdOrder.whatsappCheckoutUrl) {
        window.open(createdOrder.whatsappCheckoutUrl, '_blank', 'noopener,noreferrer')
      }

      if (createdOrder.offlinePending || isOffline) {
        toast.success('Pedido guardado. Se enviará automáticamente al recuperar conexión.')
      }
    } catch (error) {
      resetMpRedirectState()
      toast.error(error instanceof Error ? error.message : 'No se pudo procesar el pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  const tableNumber = tableSession?.tableNumber
  const headerProps =
    isTableMode && tableNumber != null
      ? { tableNumber, backHref: menuHref }
      : {}

  return (
    <>
      {!hydrated ? (
        <div className="coly-landing min-h-screen bg-white pb-36">
          <CheckoutHeader {...headerProps} />
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
      ) : showingMpRedirect ? (
        <div className="coly-landing min-h-screen bg-white pb-24 md:pb-10">
          <CheckoutHeader {...headerProps} />
          <CheckoutMain className="py-12 md:py-16">
            <div className="flex flex-col items-center text-center">
              <CheckoutLoadingSkeleton />
              <h2 className="mt-6 text-xl font-bold text-foreground">Redirigiendo a Mercado Pago</h2>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Tu pedido ya fue registrado. Completá el pago en la pantalla de Mercado Pago.
              </p>
            </div>
          </CheckoutMain>
        </div>
      ) : isEmpty ? (
        <div className="coly-landing min-h-screen bg-white pb-24 md:pb-10">
          <CheckoutHeader {...headerProps} />

          <CheckoutMain className="py-12 md:py-16">
            <div className="flex flex-col items-center text-center">
              <div
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                style={{ backgroundColor: COTY_QTY_BG }}
              >
                <ShoppingBag className="h-10 w-10" style={{ color: COTY_TEAL }} strokeWidth={1.75} />
              </div>
              {pendingMpOrder ? (
                <>
                  <h2 className="text-xl font-bold text-foreground">Pedido pendiente de pago</h2>
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                    Ya registramos tu pedido
                    {pendingMpOrder.displayCode ? ` (${pendingMpOrder.displayCode})` : ''}. Si completaste el pago,
                    podés ver el estado desde acá.
                  </p>
                  <Link
                    href={buildOrderStatusReturnUrl(new URLSearchParams(), pendingMpOrder.orderId)}
                    className="mt-8 w-full max-w-xs"
                  >
                    <Button
                      className="w-full rounded-full py-6 text-base font-bold shadow-lg"
                      style={{ backgroundColor: COTY_TEAL }}
                    >
                      Ver estado del pedido
                    </Button>
                  </Link>
                  <Link href={menuHref} className="mt-3 w-full max-w-xs">
                    <Button variant="outline" className="w-full rounded-full py-6 text-base font-bold">
                      Volver al menú
                    </Button>
                  </Link>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </CheckoutMain>
        </div>
      ) : orderComplete ? (
        <OrderConfirmationView
          orderId={completedOrderId}
          tableId={completedTableId}
          tableNumber={completedTableNumber}
          menuHref={menuHref}
          whatsappCheckoutUrl={completedWhatsappUrl}
        />
      ) : (
        <div className="coly-landing min-h-screen bg-white pb-36 md:pb-24">
          <CheckoutHeader {...headerProps} />

          <CheckoutMain className={cn('pb-4', isTableMode ? 'pt-4 md:pt-6' : 'pt-6 md:pt-8')}>
            {isTableMode && tableNumber != null ? <TableOrderTitle tableNumber={tableNumber} /> : null}
            {!isTableMode ? <TableSessionBanner className="mb-4" showClear={false} /> : null}
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
            <div className={cn(isTableMode ? 'space-y-3' : 'lg:grid lg:grid-cols-5 lg:items-start lg:gap-8')}>
              <div className={cn(isTableMode ? 'rounded-2xl border border-black/8 bg-white px-3 shadow-sm' : 'space-y-3 lg:col-span-3')}>
                {items.map((item, index) => (
                  <CartProductCard
                    key={item.id}
                    item={item}
                    index={index}
                    variant={isTableMode ? 'table' : 'cart'}
                    onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                    onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>

              <div className={cn(isTableMode ? 'space-y-3' : 'mt-3 lg:col-span-2 lg:mt-0 lg:sticky lg:top-24')}>
                {isSettingsLoading ? (
                  <CheckoutFormSkeleton />
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
                    <CheckoutSection
                      icon={<Image src="/icons/nota.svg" alt="Nota" width={17} height={17} />}
                      title={
                        <>
                          {isTableMode ? 'Notas para cocina' : 'Nota para el local'}{' '}
                          <span className="text-sm font-normal text-muted-foreground">(Opcional)</span>
                        </>
                      }
                    >
                      <Textarea
                        placeholder={
                          isTableMode
                            ? 'Ej: Sin cebolla, sin tomate, bien cocido, etc.'
                            : 'Ej: Sin cebolla, sin tomate, retirar a las 21 hs'
                        }
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className={cn(
                          'mt-2 resize-none text-sm shadow-none focus-visible:ring-1',
                          isTableMode
                            ? 'rounded-xl border border-black/8 bg-[#FAFAFA] p-3 placeholder:text-gray-400 focus-visible:ring-[#2D5A57]/30'
                            : 'rounded-none border-0 bg-transparent p-0 placeholder:px-1 placeholder:text-gray-400 focus-visible:ring-0'
                        )}
                      />
                    </CheckoutSection>

                    {!isTableMode ? (
                      <>
                        <div className="border-t border-black/8" />

                        <CheckoutSection
                          icon={<Image src="/icons/delivery.svg" alt="Delivery" width={22} height={22} />}
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
                              {deliveryFee > 0 && (
                                <span className="ml-auto text-xs text-muted-foreground">
                                  +{formatPrice(deliveryFee)}
                                </span>
                              )}
                            </label>
                          </RadioGroup>
                          {orderType === 'delivery' ? (
                            <div className="mt-3 space-y-2">
                              <Label htmlFor="delivery-address" className="flex items-center gap-2 text-xs">
                                <MapPin className="h-3.5 w-3.5" />
                                Dirección o ubicación *
                              </Label>
                              <Textarea
                                id="delivery-address"
                                placeholder="Calle, número, referencias..."
                                value={customerAddress}
                                onChange={(e) => {
                                  setCustomerAddress(e.target.value)
                                  if (deliveryCoords) setDeliveryCoords(null)
                                }}
                                rows={2}
                                required
                                className="resize-none text-sm"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full rounded-full"
                                onClick={useMyLocation}
                                disabled={locatingAddress}
                              >
                                {locatingAddress ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Crosshair className="mr-2 h-4 w-4" />
                                )}
                                {locatingAddress ? 'Obteniendo ubicación...' : 'Usar mi ubicación'}
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                El GPS sugiere la zona aproximada: completá calle, número y referencias.
                              </p>
                            </div>
                          ) : null}
                        </CheckoutSection>
                      </>
                    ) : null}

                    <div className="border-t border-black/8" />

                    <CheckoutSection
                      icon={<Image src="/icons/pedidos.svg" alt="Resumen" width={18} height={18} />}
                      title="Resumen del pedido"
                    >
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{isTableMode ? 'Subtotal' : 'Productos'}</span>
                          <span className="font-medium">
                            {formatPrice(isTableMode ? total - couponDiscount : subtotal + discount)}
                          </span>
                        </div>
                        {!isTableMode && discount > 0 && (
                          <div className="flex justify-between text-emerald-700">
                            <span>Descuento promos</span>
                            <span className="font-medium">-{formatPrice(discount)}</span>
                          </div>
                        )}
                        {!isTableMode && couponDiscount > 0 ? (
                          <div className="flex justify-between text-emerald-700">
                            <span>Cupón {couponCode}</span>
                            <span className="font-medium">-{formatPrice(couponDiscount)}</span>
                          </div>
                        ) : null}
                        {!isTableMode ? (
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
                        ) : null}
                        {!isTableMode ? (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Envío</span>
                            <span className="font-medium">{formatPrice(deliveryFee)}</span>
                          </div>
                        ) : null}
                        {isTableMode ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                Servicio (opcional)
                                <Info className="h-3.5 w-3.5" aria-hidden />
                              </span>
                              <span className="font-medium">{formatPrice(tip)}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {[0, Math.round(total * 0.1), Math.round(total * 0.15)].map((value, index) => (
                                <Button
                                  key={index}
                                  type="button"
                                  size="sm"
                                  variant={tip === value ? 'default' : 'outline'}
                                  onClick={() => setTip(value)}
                                  className={tip === value ? 'text-white' : undefined}
                                  style={tip === value ? { backgroundColor: COTY_TEAL } : undefined}
                                >
                                  {index === 0 ? 'Sin servicio' : formatPrice(value)}
                                </Button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <>
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
                            {tip > 0 ? (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Propina</span>
                                <span className="font-medium">{formatPrice(tip)}</span>
                              </div>
                            ) : null}
                          </>
                        )}
                        <div className="my-2 border-t border-black/8" />
                        <div className="flex items-center justify-between">
                          <span className="font-bold">Total</span>
                          <span className="text-xl font-bold" style={{ color: COTY_HEADER }}>
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
                  onClick={(e) => {
                    if (isTableMode) {
                      void handleSubmit(e as unknown as React.FormEvent)
                      return
                    }
                    if (orderType === 'delivery' && !customerAddress.trim()) {
                      toast.error('Por favor ingresá tu dirección de entrega')
                      return
                    }
                    setConfirmOpen(true)
                  }}
                  disabled={isSubmitting || isClosed || belowMinOrder}
                  className="flex w-full items-center justify-between rounded-full px-6 py-4 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: COTY_HEADER }}
                >
                  <span className="flex-1 text-center">
                    {isSubmitting ? 'Procesando...' : isTableMode ? 'Enviar pedido' : 'Confirmar pedido'}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
                    <ArrowRight className="h-5 w-5" style={{ color: COTY_TEAL }} />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmOpen && !isEmpty && !orderComplete && !isTableMode && (
        <SimpleModal open onClose={() => setConfirmOpen(false)} title="Datos para confirmar" className="max-w-md">
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
                    onChange={(e) => {
                      setCustomerAddress(e.target.value)
                      if (deliveryCoords) setDeliveryCoords(null)
                    }}
                    rows={2}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-full"
                    onClick={useMyLocation}
                    disabled={locatingAddress}
                  >
                    {locatingAddress ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Crosshair className="mr-2 h-4 w-4" />
                    )}
                    {locatingAddress ? 'Obteniendo ubicación...' : 'Usar mi ubicación'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    El GPS sugiere la zona aproximada: completá calle, número y referencias.
                  </p>
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
                    { value: 'transfer', label: 'Transferencia', icon: Building2 },
                    { value: 'cash', label: 'Efectivo', icon: Banknote },
                    ...(isTableMode || !mercadoPagoAvailable
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
                {paymentMethod === 'transfer' && !isTableMode ? (
                  <TransferPaymentDetails
                    transferAlias={settings.transferAlias}
                    transferCbu={settings.transferCbu}
                    total={finalTotal}
                    className="mt-3"
                  />
                ) : null}
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
        </SimpleModal>
      )}
    </>
  )
}
