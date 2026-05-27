'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Coffee,
  ChevronLeft,
  Truck,
  Store,
  CreditCard,
  Banknote,
  Building2,
  MessageCircle,
  MapPin,
  User,
  Phone,
  FileText,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCart, useBusiness, useOrders } from '@/lib/store'
import { EmptyState } from '@/components/shared/empty-state'
import type { OrderType, PaymentMethod, Order } from '@/lib/types'
import { toast } from 'sonner'

export function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const { settings } = useBusiness()
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

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <EmptyState
          icon="cart"
          title="Carrito vacío"
          description="Agrega productos antes de continuar al checkout"
          action={{
            label: 'Ver menú',
            onClick: () => router.push('/menu'),
          }}
        />
      </div>
    )
  }

  const deliveryFee = orderType === 'delivery' ? settings.deliveryFee : 0
  const tax = total * settings.taxRate
  const finalTotal = total + tax + deliveryFee

  const generateWhatsAppMessage = (order: Order) => {
    const itemsList = order.items
      .map(item => {
        const options = item.selectedOptions
          ?.map(opt => {
            const productOpt = item.product.options?.find(o => o.id === opt.optionId)
            return opt.choiceIds
              .map(cId => productOpt?.choices.find(c => c.id === cId)?.name)
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
💳 *Pago:* ${
      paymentMethod === 'cash'
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
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    if (orderType === 'delivery' && !customerAddress) {
      toast.error('Por favor ingresa tu dirección de entrega')
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
          headers: {
            'Content-Type': 'application/json',
          },
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
      clearCart()

      const whatsappUrl = `https://wa.me/${settings.whatsapp}?text=${generateWhatsAppMessage(createdOrder)}`
      window.open(whatsappUrl, '_blank')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo procesar el pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (orderComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="font-serif text-2xl font-bold">¡Pedido Confirmado!</h1>
          <p className="mt-2 text-muted-foreground">
            Tu pedido #{orderId} ha sido enviado por WhatsApp
          </p>
          <div className="mt-6 space-y-3">
            <Link href="/order-status">
              <Button className="w-full">Ver estado del pedido</Button>
            </Link>
            <Link href="/menu">
              <Button variant="outline" className="w-full">
                Hacer otro pedido
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Link href="/menu">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Coffee className="h-6 w-6 text-primary" />
            <span className="font-serif text-lg font-bold">Checkout</span>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
          {/* Order Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5" />
                Tipo de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={orderType}
                onValueChange={(v) => setOrderType(v as OrderType)}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="pickup"
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    orderType === 'pickup' ? 'border-primary bg-primary/5' : 'border-muted'
                  }`}
                >
                  <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
                  <Store className="h-8 w-8" />
                  <span className="font-medium">Recoger</span>
                  <span className="text-xs text-muted-foreground">En tienda</span>
                </Label>
                <Label
                  htmlFor="delivery"
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    orderType === 'delivery' ? 'border-primary bg-primary/5' : 'border-muted'
                  }`}
                >
                  <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
                  <Truck className="h-8 w-8" />
                  <span className="font-medium">Delivery</span>
                  <span className="text-xs text-muted-foreground">+${settings.deliveryFee}</span>
                </Label>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Tu nombre"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
              </div>
              {orderType === 'delivery' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <Label htmlFor="address">Dirección de Entrega *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      placeholder="Calle, número, colonia, referencias..."
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="min-h-[80px] pl-9"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Método de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                className="space-y-3"
              >
                <Label
                  htmlFor="cash"
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                    paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-muted'
                  }`}
                >
                  <RadioGroupItem value="cash" id="cash" />
                  <Banknote className="h-5 w-5" />
                  <span className="font-medium">Efectivo</span>
                </Label>
                <Label
                  htmlFor="card"
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                    paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-muted'
                  }`}
                >
                  <RadioGroupItem value="card" id="card" />
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Tarjeta (al recibir)</span>
                </Label>
                <Label
                  htmlFor="transfer"
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                    paymentMethod === 'transfer' ? 'border-primary bg-primary/5' : 'border-muted'
                  }`}
                >
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">Transferencia</span>
                </Label>
                <Label
                  htmlFor="mercado_pago"
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                    paymentMethod === 'mercado_pago' ? 'border-primary bg-primary/5' : 'border-muted'
                  }`}
                >
                  <RadioGroupItem value="mercado_pago" id="mercado_pago" />
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Mercado Pago</span>
                </Label>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Notas del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Instrucciones especiales para tu pedido..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.product.name}
                  </span>
                  <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA ({(settings.taxRate * 100).toFixed(0)}%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Envío</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="font-serif">${finalTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Procesando...</>
            ) : (
              <>
                <MessageCircle className="h-5 w-5" />
                {paymentMethod === 'mercado_pago' ? 'Continuar al pago online' : 'Enviar Pedido por WhatsApp'}
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}
