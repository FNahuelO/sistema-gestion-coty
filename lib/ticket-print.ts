import { formatDateAR, formatTimeAR, formatDateTimeAR } from '@/lib/datetime'
import { formatPrice } from '@/lib/coty-theme'
import { getPaymentStatusLabel, ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/order-labels'
import type { Order } from '@/lib/types'

export type TicketVariant = 'kitchen' | 'customer'

export type TicketPrintInput = {
  order: Order
  businessName: string
}

/** Nexuspös X-NX 58II UB — 58 mm ≈ 32 caracteres por línea. */
const LINE_WIDTH = 32
const SEPARATOR = '-'.repeat(26)

const TICKET_STYLES = `
  @page { size: 58mm auto; margin: 0; }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    width: 58mm;
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .ticket {
    width: ${LINE_WIDTH}ch;
    max-width: ${LINE_WIDTH}ch;
    margin: 0 auto;
    padding: 2mm 0;
    page-break-after: always;
    font-family: "Courier New", Courier, monospace;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.3;
    white-space: pre;
    overflow: hidden;
    -webkit-font-smoothing: none;
    font-smooth: never;
  }

  .ticket:last-child { page-break-after: auto; }

  @media print {
    html, body { background: #fff; color: #000; }
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

function twoColumns(left: string, right: string, width = LINE_WIDTH): string {
  const rightText = right.slice(0, width)
  const maxLeft = Math.max(1, width - rightText.length)
  const leftText = left.length > maxLeft ? left.slice(0, maxLeft) : left
  return leftText.padEnd(width - rightText.length) + rightText
}

function wrapPrefixed(prefix: string, value: string, width = LINE_WIDTH): string[] {
  const words = value.split(/\s+/)
  const lines: string[] = []
  let current = prefix

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= width) {
      current = candidate
      continue
    }

    if (current) lines.push(line(current, width))
    current = word
  }

  if (current) lines.push(line(current, width))
  return lines.length ? lines : [line(prefix, width)]
}

function renderItemLines(order: Order, showPrices: boolean): string[] {
  const lines: string[] = []

  for (const item of order.items) {
    const unitPrice = getItemUnitPrice(item)
    const lineTotal = unitPrice * item.quantity
    const itemLabel = `• ${item.product.name} (x${item.quantity})`

    if (showPrices) {
      lines.push(twoColumns(itemLabel, formatPrice(lineTotal)))
    } else {
      lines.push(line(itemLabel))
    }

    if (item.selectionLines?.length) {
      for (const selection of item.selectionLines) {
        const addonLabel = `  • ${selection.choiceName} (x${item.quantity})`
        if (showPrices) {
          lines.push(twoColumns(addonLabel, formatPrice(selection.priceModifier * item.quantity)))
        } else {
          lines.push(line(addonLabel))
        }
      }
    }

    if (item.notes) {
      lines.push(...wrapPrefixed('  Nota:', item.notes))
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
    line(`Medio de pago: ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`),
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
    lines.push(line(`-Zona de envío: ${order.deliveryZoneName}`))
  }
  if (order.customerPhone && order.customerPhone !== 'mesa') {
    lines.push(line(`-Teléfono: ${order.customerPhone}`))
  }
  if (order.tableNumber) {
    lines.push(line(`-Mesa: ${order.tableNumber}`))
  }

  lines.push(
    SEPARATOR,
    twoColumns('Items:', 'Precio Unit.'),
    ...renderItemLines(order, true),
    SEPARATOR,
    line(`Total de productos: ${formatPrice(productsTotal)}`)
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
    line(`${ORDER_TYPE_LABELS[order.type]}${order.tableNumber ? ` · Mesa ${order.tableNumber}` : ''}`),
    line(`Hora: ${formatDateTimeAR(createdAt)}`),
    line(`Cliente: ${order.customerName}`),
  ]

  if (order.customerAddress) lines.push(line(`Dirección: ${order.customerAddress}`))
  if (order.deliveryZoneName) lines.push(line(`Zona: ${order.deliveryZoneName}`))
  if (order.notes) lines.push(...wrapPrefixed('Notas:', order.notes))

  lines.push(SEPARATOR, line('Items:'), ...renderItemLines(order, false), SEPARATOR)
  lines.push(center(`Comanda de cocina · ${businessName}`))

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
    <meta name="viewport" content="width=${LINE_WIDTH}ch" />
    <title>Ticket ${escapeHtml(getOrderLabel(input.order))}</title>
    <style>${TICKET_STYLES}</style>
  </head>
  <body>${body}</body>
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
  iframe.style.height = '100vh'
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
