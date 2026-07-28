import { PAYMENT_METHOD_LABELS, ORDER_TYPE_LABELS, formatPublicOrderCode } from '@/lib/order-labels'
import type { CartItem, Order, PaymentMethod } from '@/lib/types'

type OrderMessageItem = Pick<CartItem, 'quantity' | 'product' | 'selectedOptions'>

type OrderMessageInput = Pick<
  Order,
  | 'displayCode'
  | 'id'
  | 'customerName'
  | 'customerPhone'
  | 'customerAddress'
  | 'total'
  | 'paymentMethod'
  | 'paymentSplits'
  | 'type'
  | 'notes'
  | 'tableNumber'
> & {
  items: OrderMessageItem[]
}

export type WhatsAppMessageOptions = {
  transferAlias?: string | null
  transferCbu?: string | null
  includePaymentInstructions?: boolean
}

export function buildWhatsAppChatUrl(phone: string) {
  const digits = phone.replace(/\D/g, '')

  if (digits.startsWith('549')) return `https://wa.me/${digits}`
  if (digits.startsWith('54')) return `https://wa.me/549${digits.slice(2)}`
  if (digits.length === 10) return `https://wa.me/549${digits}`

  return `https://wa.me/${digits}`
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

function formatTransferDetails(options?: WhatsAppMessageOptions) {
  const lines: string[] = []
  if (options?.transferAlias?.trim()) {
    lines.push(`🏦 *Alias/CVU:* ${options.transferAlias.trim()}`)
  }
  if (options?.transferCbu?.trim()) {
    lines.push(`🔢 *CBU:* ${options.transferCbu.trim()}`)
  }
  return lines.join('\n')
}

export function buildWhatsAppOrderMessage(
  order: OrderMessageInput,
  businessName: string,
  options?: WhatsAppMessageOptions
) {
  const code = formatPublicOrderCode(order)
  const itemsList = order.items
    .map((item) => {
      const optionsLabel = formatItemOptions(item)
      return `• ${item.quantity}x ${item.product.name}${optionsLabel ? ` (${optionsLabel})` : ''}`
    })
    .join('\n')

  const paymentLabel = PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod] ?? order.paymentMethod
  const paymentDetail =
    order.paymentMethod === 'combined' && order.paymentSplits?.length
      ? order.paymentSplits
          .map((split) => `${PAYMENT_METHOD_LABELS[split.method]} $${split.amount.toFixed(2)}`)
          .join(' + ')
      : null
  const typeLabel = ORDER_TYPE_LABELS[order.type] ?? order.type
  const transferDetails = formatTransferDetails(options)
  const hasTransferSplit = Boolean(order.paymentSplits?.some((split) => split.method === 'transfer'))
  const showPaymentInstructions =
    options?.includePaymentInstructions &&
    order.type !== 'table' &&
    (order.paymentMethod === 'transfer' || (order.paymentMethod === 'combined' && hasTransferSplit))

  return `🧾 *Nuevo Pedido - ${businessName}*

📋 *Pedido ${code}*
${order.tableNumber ? `🪑 *Mesa:* ${order.tableNumber}\n` : ''}👤 *Cliente:* ${order.customerName}
📱 *Teléfono:* ${order.customerPhone}
${order.customerAddress ? `📍 *Dirección:* ${order.customerAddress}\n` : ''}🛒 *Productos:*
${itemsList}

💰 *Total:* $${order.total.toFixed(2)}
💳 *Pago:* ${paymentLabel}${paymentDetail ? `\n   (${paymentDetail})` : ''}
${transferDetails ? `${transferDetails}\n` : ''}📦 *Tipo:* ${typeLabel}
${order.notes ? `\n📝 *Notas:* ${order.notes}` : ''}${
    showPaymentInstructions
      ? `\n\n📎 *Enviá el comprobante de transferencia por este chat para confirmar tu pedido.*`
      : ''
  }`.trim()
}

export function buildWhatsAppUrl(
  phone: string,
  order: OrderMessageInput,
  businessName: string,
  options?: WhatsAppMessageOptions
) {
  const text = encodeURIComponent(buildWhatsAppOrderMessage(order, businessName, options))
  return `${buildWhatsAppChatUrl(phone)}?text=${text}`
}
