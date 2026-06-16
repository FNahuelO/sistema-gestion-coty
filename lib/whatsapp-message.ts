import { PAYMENT_METHOD_LABELS, ORDER_TYPE_LABELS } from '@/lib/order-labels'
import type { CartItem, Order, PaymentMethod } from '@/lib/types'

type OrderMessageItem = Pick<CartItem, 'quantity' | 'product' | 'selectedOptions'>

type OrderMessageInput = Pick<
  Order,
  'displayCode' | 'id' | 'customerName' | 'customerPhone' | 'customerAddress' | 'total' | 'paymentMethod' | 'type' | 'notes'
> & {
  items: OrderMessageItem[]
}

function formatItemOptions(item: OrderMessageItem) {
  return item.selectedOptions
    ?.map((opt) => {
      const productOpt = item.product.options?.find((o) => o.id === opt.optionId)
      const choiceNames = opt.choiceIds
        .map((cId) => productOpt?.choices.find((c) => c.id === cId)?.name ?? cId)
        .join(', ')
      if (productOpt) {
        return `${productOpt.name}: ${choiceNames}`
      }
      return choiceNames
    })
    .filter(Boolean)
    .join(' | ')
}

export function buildWhatsAppOrderMessage(order: OrderMessageInput, businessName: string) {
  const code = order.displayCode ?? order.id
  const itemsList = order.items
    .map((item) => {
      const options = formatItemOptions(item)
      return `• ${item.quantity}x ${item.product.name}${options ? ` (${options})` : ''}`
    })
    .join('\n')

  const paymentLabel = PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod] ?? order.paymentMethod
  const typeLabel = ORDER_TYPE_LABELS[order.type] ?? order.type

  return `🧾 *Nuevo Pedido - ${businessName}*

📋 *Pedido ${code}*
👤 *Cliente:* ${order.customerName}
📱 *Teléfono:* ${order.customerPhone}
${order.customerAddress ? `📍 *Dirección:* ${order.customerAddress}\n` : ''}🛒 *Productos:*
${itemsList}

💰 *Total:* $${order.total.toFixed(2)}
💳 *Pago:* ${paymentLabel}
📦 *Tipo:* ${typeLabel}
${order.notes ? `\n📝 *Notas:* ${order.notes}` : ''}`.trim()
}

export function buildWhatsAppUrl(phone: string, order: OrderMessageInput, businessName: string) {
  const normalizedPhone = phone.replace(/\D/g, '')
  const text = encodeURIComponent(buildWhatsAppOrderMessage(order, businessName))
  return `https://wa.me/${normalizedPhone}?text=${text}`
}
