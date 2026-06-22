type PreferenceLineItem = {
  id: string
  title: string
  description?: string
  picture_url?: string
  quantity: number
  currency_id: string
  unit_price: number
}

type OrderForPreference = {
  items: Array<{
    productId: string | null
    id: string
    productName: string
    productDescription: string | null
    imageUrl: string | null
    quantity: number
    unitPrice: unknown
  }>
  tax: unknown
  deliveryFee: unknown
  tip: unknown
  discountAmount: unknown
}

function toAmount(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  if (value && typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function') {
    return value.toNumber()
  }
  return Number(value ?? 0)
}

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim())
}

export function isMercadoPagoSandbox() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() ?? ''
  return token.startsWith('TEST-')
}

export function isMercadoPagoAvailable(settings?: { mercadoPagoEnabled?: boolean } | null) {
  return isMercadoPagoConfigured() && (settings?.mercadoPagoEnabled ?? true)
}

export function resolveMercadoPagoCheckoutUrl(initPoint?: string | null, sandboxInitPoint?: string | null) {
  if (isMercadoPagoSandbox()) {
    return sandboxInitPoint ?? initPoint ?? undefined
  }
  return initPoint ?? sandboxInitPoint ?? undefined
}

export function resolveMercadoPagoPayerEmail(customerName: string, customerPhone: string) {
  const digits = customerPhone.replace(/\D/g, '').slice(-12)
  const slug = customerName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 24)
    .toLowerCase()

  const localPart = [slug || 'cliente', digits || Date.now().toString(36)].filter(Boolean).join('.')
  return `${localPart}@pagos.cotycafe.local`
}

export function buildMercadoPagoPreferenceItems(order: OrderForPreference) {
  const items: PreferenceLineItem[] = order.items.map((item) => ({
    id: item.productId ?? item.id,
    title: item.productName,
    description: item.productDescription ?? undefined,
    picture_url: item.imageUrl ?? undefined,
    quantity: item.quantity,
    currency_id: 'ARS',
    unit_price: toAmount(item.unitPrice),
  }))

  const tax = toAmount(order.tax)
  const deliveryFee = toAmount(order.deliveryFee)
  const tip = toAmount(order.tip)
  const discountAmount = toAmount(order.discountAmount)

  if (deliveryFee > 0) {
    items.push({
      id: 'delivery-fee',
      title: 'Envío',
      quantity: 1,
      currency_id: 'ARS',
      unit_price: deliveryFee,
    })
  }

  if (tax > 0) {
    items.push({
      id: 'tax',
      title: 'Impuestos',
      quantity: 1,
      currency_id: 'ARS',
      unit_price: tax,
    })
  }

  if (tip > 0) {
    items.push({
      id: 'tip',
      title: 'Propina',
      quantity: 1,
      currency_id: 'ARS',
      unit_price: tip,
    })
  }

  return {
    items,
    couponAmount: discountAmount > 0 ? discountAmount : undefined,
  }
}
