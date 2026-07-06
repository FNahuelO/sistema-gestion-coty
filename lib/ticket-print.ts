import { formatDateAR, formatTimeAR, formatDateTimeAR } from '@/lib/datetime'
import { formatPrice } from '@/lib/coty-theme'
import { getPaymentStatusLabel, ORDER_TYPE_LABELS } from '@/lib/order-labels'
import type { Order } from '@/lib/types'

export type TicketVariant = 'kitchen' | 'customer'

export type TicketPrintInput = {
  order: Order
  businessName: string
}

/**
 * Nexuspös X-NX 58II UB — área imprimible real ≈ 26-28 chars
 * (32 cols teóricos, pero el driver recorta ~4 chars a la derecha).
 */
const LINE_WIDTH = 28
const PRICE_WIDTH = 8
const SEPARATOR = '-'.repeat(22)

const TICKET_PAYMENT_LABELS: Record<Order['paymentMethod'], string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  mercado_pago: 'Mercado Pago',
}

const TICKET_STYLES = `
  @page {
    size: 58mm 297mm portrait;
    margin: 0;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    display: block;
    width: 58mm;
    max-width: 58mm;
    min-width: 58mm;
    height: auto;
    margin: 0;
    padding: 0 1.5mm 0 0.5mm;
    background: #fff;
    color: #000;
    writing-mode: horizontal-tb;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print-root {
    display: block;
    width: 58mm;
    max-width: 58mm;
    column-count: 1;
    columns: auto;
  }

  .ticket {
    display: block;
    width: ${LINE_WIDTH}ch;
    max-width: ${LINE_WIDTH}ch;
    margin: 0;
    padding: 2mm 0;
    page-break-after: always;
    break-after: page;
    column-count: 1;
    columns: auto;
    float: none;
    clear: both;
    font-family: "Courier New", Courier, monospace;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.3;
    white-space: pre;
    overflow: hidden;
    -webkit-font-smoothing: none;
    font-smooth: never;
  }

  .ticket:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  @media print {
    @page {
      size: 58mm 297mm portrait;
      margin: 0;
    }

    html, body {
      width: 58mm !important;
      max-width: 58mm !important;
      min-width: 58mm !important;
      height: auto !important;
      background: #fff;
      color: #000;
    }

    .print-root {
      width: 58mm !important;
      max-width: 58mm !important;
      column-count: 1 !important;
    }

    .ticket {
      display: block !important;
      float: none !important;
      column-count: 1 !important;
      width: ${LINE_WIDTH}ch !important;
      max-width: ${LINE_WIDTH}ch !important;
    }
  }
`

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function getOrderLabel(order: Order) {
  return order.displayCode ?? order.id.slice(0, 8).toUpperCase()
}

function formatOrderNumber(order: Order) {
  return `Orden nº ${getOrderLabel(order)}`
}

function getTicketPaymentStatus(order: Order) {
  if (order.paymentStatus === 'approved') return 'Pagado'
  const label = getPaymentStatusLabel(order)
  return label || '—'
}

function getItemUnitPrice(item: Order['items'][number]) {
  return item.unitPrice ?? item.product.price
}

function center(text: string, width = LINE_WIDTH): string {
  const trimmed = text.slice(0, width)
  if (trimmed.length >= width) return trimmed
  const pad = width - trimmed.length
  const left = Math.floor(pad / 2)
  return ' '.repeat(left) + trimmed + ' '.repeat(pad - left)
}

function line(text: string, width = LINE_WIDTH): string {
  return text.slice(0, width)
}

function formatPriceColumn(price: string): string {
  if (price.length > PRICE_WIDTH) return price.slice(-PRICE_WIDTH)
  return ' '.repeat(PRICE_WIDTH - price.length) + price
}

function twoColumns(left: string, right: string, width = LINE_WIDTH): string {
  const rightText = formatPriceColumn(right)
  const maxLeft = width - PRICE_WIDTH
  const leftText = left.length > maxLeft ? left.slice(0, maxLeft) : left
  return leftText.padEnd(maxLeft) + rightText
}

function wrapText(text: string, width = LINE_WIDTH): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= width) {
      current = candidate
      continue
    }

    if (current) lines.push(line(current, width))
    current = word.length > width ? word.slice(0, width) : word
  }

  if (current) lines.push(line(current, width))
  return lines.length ? lines : [line('', width)]
}

function wrapPrefixed(prefix: string, value: string, width = LINE_WIDTH): string[] {
  return wrapText(`${prefix} ${value}`.trim(), width)
}

function renderPricedLine(label: string, price: number): string[] {
  const priceText = formatPrice(price)
  const available = LINE_WIDTH - PRICE_WIDTH

  if (label.length <= available) {
    return [twoColumns(label, priceText)]
  }

  const wrapped = wrapText(label, LINE_WIDTH)
  const lastIndex = wrapped.length - 1
  const lastLine = wrapped[lastIndex]

  if (lastLine.length <= available) {
    wrapped[lastIndex] = twoColumns(lastLine, priceText)
    return wrapped
  }

  wrapped.push(formatPriceColumn(priceText))
  return wrapped
}

function renderItemLines(order: Order, showPrices: boolean): string[] {
  const lines: string[] = []

  for (const item of order.items) {
    const unitPrice = getItemUnitPrice(item)
    const lineTotal = unitPrice * item.quantity
    const itemLabel = `• ${item.product.name} (x${item.quantity})`

    if (showPrices) {
      lines.push(...renderPricedLine(itemLabel, lineTotal))
    } else {
      lines.push(...wrapText(itemLabel))
    }

    if (item.selectionLines?.length) {
      for (const selection of item.selectionLines) {
        const addonLabel = `  • ${selection.choiceName} (x${item.quantity})`
        const addonTotal = selection.priceModifier * item.quantity
        if (showPrices) {
          lines.push(...renderPricedLine(addonLabel, addonTotal))
        } else {
          lines.push(...wrapText(addonLabel))
        }
      }
    }

    if (item.notes) {
      lines.push(...wrapPrefixed('Nota:', item.notes))
    }
  }

  return lines
}

function renderCustomerTicketText({ order, businessName }: TicketPrintInput): string {
  const createdAt = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt)
  const productsTotal = order.items.reduce(
    (sum, item) => sum + getItemUnitPrice(item) * item.quantity,
    0
  )

  const lines: string[] = [
    center('*** TICKET ***'),
    center(businessName),
    center(formatOrderNumber(order)),
    SEPARATOR,
    line(`Modalidad: ${ORDER_TYPE_LABELS[order.type]}`),
    line(`Pago: ${TICKET_PAYMENT_LABELS[order.paymentMethod]}`),
    line(`Estado: ${getTicketPaymentStatus(order)}`),
    line(`Fecha: ${formatDateAR(createdAt)}`),
    line(`Hora: ${formatTimeAR(createdAt)}`),
    SEPARATOR,
    line('Datos del cliente:'),
    line(`-Nombre: ${order.customerName}`),
  ]

  if (order.customerAddress) {
    lines.push(...wrapPrefixed('-Dirección:', order.customerAddress))
  }
  if (order.deliveryZoneName) {
    lines.push(line(`-Zona: ${order.deliveryZoneName}`))
  }
  if (order.customerPhone && order.customerPhone !== 'mesa') {
    lines.push(line(`-Teléfono: ${order.customerPhone}`))
  }
  if (order.tableNumber) {
    lines.push(line(`-Mesa: ${order.tableNumber}`))
  }

  lines.push(
    SEPARATOR,
    twoColumns('Items:', 'Precio'),
    ...renderItemLines(order, true),
    SEPARATOR,
    line(`Total productos: ${formatPrice(productsTotal)}`)
  )

  if (order.deliveryFee) lines.push(line(`Envío: ${formatPrice(order.deliveryFee)}`))
  if (order.discountAmount) lines.push(line(`Descuento: -${formatPrice(order.discountAmount)}`))
  if (order.tip) lines.push(line(`Propina: ${formatPrice(order.tip)}`))

  lines.push(line(`TOTAL: ${formatPrice(order.total)}`), SEPARATOR, center(businessName))

  return lines.join('\n')
}

function renderKitchenTicketText({ order, businessName }: TicketPrintInput): string {
  const createdAt = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt)

  const lines: string[] = [
    center('*** COCINA ***'),
    center(businessName),
    center(formatOrderNumber(order)),
    SEPARATOR,
    line(`${ORDER_TYPE_LABELS[order.type]}${order.tableNumber ? ` M${order.tableNumber}` : ''}`),
    line(`Hora: ${formatDateTimeAR(createdAt)}`),
    line(`Cliente: ${order.customerName}`),
  ]

  if (order.customerAddress) lines.push(...wrapText(`Dir: ${order.customerAddress}`))
  if (order.deliveryZoneName) lines.push(line(`Zona: ${order.deliveryZoneName}`))
  if (order.notes) lines.push(...wrapPrefixed('Notas:', order.notes))

  lines.push(SEPARATOR, line('Items:'), ...renderItemLines(order, false), SEPARATOR)
  lines.push(center(`Cocina · ${businessName}`))

  return lines.join('\n')
}

export function buildTicketPrintDocument(input: TicketPrintInput, variants: TicketVariant[]) {
  const body = variants
    .map((variant) => {
      const text =
        variant === 'kitchen'
          ? renderKitchenTicketText(input)
          : renderCustomerTicketText(input)
      return `<pre class="ticket">${escapeHtml(text)}</pre>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=58mm, initial-scale=1" />
    <title>Ticket ${escapeHtml(getOrderLabel(input.order))}</title>
    <style>${TICKET_STYLES}</style>
  </head>
  <body><div class="print-root">${body}</div></body>
</html>`
}

export function printOrderTickets(
  input: TicketPrintInput,
  variants: TicketVariant[] = ['kitchen', 'customer']
) {
  if (typeof window === 'undefined') return

  const html = buildTicketPrintDocument(input, variants)
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.position = 'fixed'
  iframe.style.left = '0'
  iframe.style.top = '0'
  iframe.style.width = '58mm'
  iframe.style.height = 'auto'
  iframe.style.minHeight = '200mm'
  iframe.style.border = '0'
  iframe.style.opacity = '0'
  iframe.style.pointerEvents = 'none'
  iframe.style.zIndex = '-1'
  document.body.appendChild(iframe)

  const frameWindow = iframe.contentWindow
  const frameDocument = iframe.contentDocument
  if (!frameWindow || !frameDocument) {
    document.body.removeChild(iframe)
    return
  }

  let printed = false

  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }, 2000)
  }

  const triggerPrint = () => {
    if (printed) return
    printed = true
    window.setTimeout(() => {
      frameWindow.focus()
      frameWindow.print()
    }, 150)
  }

  frameWindow.addEventListener('afterprint', cleanup, { once: true })
  iframe.addEventListener('load', triggerPrint, { once: true })

  frameDocument.open()
  frameDocument.write(html)
  frameDocument.close()

  window.setTimeout(triggerPrint, 800)
  window.setTimeout(cleanup, 20000)
}
