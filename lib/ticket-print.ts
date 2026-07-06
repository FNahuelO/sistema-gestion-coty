import { formatDateAR, formatTimeAR, formatDateTimeAR } from '@/lib/datetime'
import { formatPrice } from '@/lib/coty-theme'
import { getPaymentStatusLabel, ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/order-labels'
import type { Order } from '@/lib/types'

export type TicketVariant = 'kitchen' | 'customer'

export type TicketPrintInput = {
  order: Order
  businessName: string
}

/**
 * Nexuspös X-NX 58II UB — papel 58 mm, ~384 dots @ 203 dpi.
 * Usamos px fijos para que el driver no escale ni recorte el margen derecho.
 */
const TICKET_WIDTH_PX = 384
const TICKET_PADDING_PX = 12
const SEPARATOR_LINE = '------------------------'

const TICKET_STYLES = `
  @page {
    size: 58mm auto;
    margin: 0;
  }

  * {
    box-sizing: border-box;
    color: #000 !important;
  }

  html, body {
    width: ${TICKET_WIDTH_PX}px;
    max-width: ${TICKET_WIDTH_PX}px;
    margin: 0;
    padding: 0;
    background: #fff !important;
    font-family: "Courier New", Courier, monospace;
    font-size: 14px;
    font-weight: 900;
    line-height: 1.35;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    -webkit-font-smoothing: none;
    font-smooth: never;
    text-rendering: geometricPrecision;
  }

  .ticket {
    width: 100%;
    padding: ${TICKET_PADDING_PX}px;
    page-break-after: always;
  }

  .ticket:last-child { page-break-after: auto; }

  .center { text-align: center; }
  .bold { font-weight: 900; }
  .separator {
    margin: 6px 0;
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0;
    overflow: hidden;
    white-space: nowrap;
  }
  .section-title { font-weight: 900; margin-top: 4px; }
  .item-block { margin-top: 6px; }
  .item-price {
    margin-top: 2px;
    padding-left: 10px;
    font-weight: 900;
  }
  .addon {
    padding-left: 10px;
    font-size: 13px;
    font-weight: 900;
    margin-top: 2px;
  }
  .header-title { font-size: 16px; font-weight: 900; }
  .business-name { font-size: 17px; font-weight: 900; margin-top: 2px; }
  .order-code { font-size: 14px; font-weight: 900; margin-top: 2px; }
  .field {
    margin: 2px 0;
    font-weight: 900;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  @media print {
    html, body {
      width: ${TICKET_WIDTH_PX}px !important;
      max-width: ${TICKET_WIDTH_PX}px !important;
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

function separator() {
  return `<div class="separator">${SEPARATOR_LINE}</div>`
}

function field(text: string) {
  return `<div class="field">${text}</div>`
}

function renderItemLines(order: Order, showPrices: boolean) {
  return order.items
    .map((item) => {
      const unitPrice = getItemUnitPrice(item)
      const lineTotal = unitPrice * item.quantity
      const addons = item.selectionLines?.length
        ? item.selectionLines
            .map((selection) => {
              const addonPrice = selection.priceModifier * item.quantity
              const priceLabel = showPrices ? ` — ${formatPrice(addonPrice)}` : ''
              return `<div class="addon">• ${escapeHtml(selection.choiceName)} (x${item.quantity})${priceLabel}</div>`
            })
            .join('')
        : ''

      const itemName = `• ${escapeHtml(item.product.name)} (x${item.quantity})`
      const addonsTitle = addons ? '<div class="addon section-title">Adicionales:</div>' : ''

      if (showPrices) {
        return `
          <div class="item-block">
            ${field(itemName)}
            <div class="item-price">${formatPrice(lineTotal)}</div>
            ${addonsTitle}
            ${addons}
            ${item.notes ? `<div class="addon">Nota: ${escapeHtml(item.notes)}</div>` : ''}
          </div>
        `
      }

      return `
        <div class="item-block">
          ${field(itemName)}
          ${addonsTitle}
          ${addons}
          ${item.notes ? `<div class="addon">Nota: ${escapeHtml(item.notes)}</div>` : ''}
        </div>
      `
    })
    .join('')
}

function renderCustomerTicket({ order, businessName }: TicketPrintInput) {
  const createdAt = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt)
  const productsTotal = order.items.reduce(
    (sum, item) => sum + getItemUnitPrice(item) * item.quantity,
    0
  )

  return `
    <section class="ticket">
      <div class="center header-title">*** TICKET ***</div>
      <div class="center business-name">${escapeHtml(businessName)}</div>
      <div class="center order-code">${escapeHtml(formatOrderNumber(order))}</div>
      ${separator()}

      ${field(`Modalidad: ${escapeHtml(ORDER_TYPE_LABELS[order.type])}`)}
      ${field(`Medio de pago: ${escapeHtml(PAYMENT_METHOD_LABELS[order.paymentMethod])}`)}
      ${field(`Estado: ${escapeHtml(getTicketPaymentStatus(order))}`)}
      ${field(`Fecha: ${formatDateAR(createdAt)}`)}
      ${field(`Hora: ${formatTimeAR(createdAt)}`)}
      ${separator()}

      <div class="section-title">Datos del cliente:</div>
      ${field(`-Nombre: ${escapeHtml(order.customerName)}`)}
      ${order.customerAddress ? field(`-Dirección: ${escapeHtml(order.customerAddress)}`) : ''}
      ${order.deliveryZoneName ? field(`-Zona de envío: ${escapeHtml(order.deliveryZoneName)}`) : ''}
      ${order.customerPhone && order.customerPhone !== 'mesa' ? field(`-Teléfono: ${escapeHtml(order.customerPhone)}`) : ''}
      ${order.tableNumber ? field(`-Mesa: ${order.tableNumber}`) : ''}
      ${separator()}

      <div class="section-title">Items:</div>
      ${renderItemLines(order, true)}
      ${separator()}

      ${field(`Total de productos: ${formatPrice(productsTotal)}`)}
      ${order.deliveryFee ? field(`Envío: ${formatPrice(order.deliveryFee)}`) : ''}
      ${order.discountAmount ? field(`Descuento: -${formatPrice(order.discountAmount)}`) : ''}
      ${order.tip ? field(`Propina: ${formatPrice(order.tip)}`) : ''}
      ${field(`TOTAL: ${formatPrice(order.total)}`)}
      ${separator()}
      <div class="center">${escapeHtml(businessName)}</div>
    </section>
  `
}

function renderKitchenTicket({ order, businessName }: TicketPrintInput) {
  const createdAt = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt)

  return `
    <section class="ticket">
      <div class="center header-title">*** COCINA ***</div>
      <div class="center business-name">${escapeHtml(businessName)}</div>
      <div class="center order-code">${escapeHtml(formatOrderNumber(order))}</div>
      ${separator()}

      ${field(`${escapeHtml(ORDER_TYPE_LABELS[order.type])}${order.tableNumber ? ` · Mesa ${order.tableNumber}` : ''}`)}
      ${field(`Hora: ${formatDateTimeAR(createdAt)}`)}
      ${field(`Cliente: ${escapeHtml(order.customerName)}`)}
      ${order.customerAddress ? field(`Dirección: ${escapeHtml(order.customerAddress)}`) : ''}
      ${order.deliveryZoneName ? field(`Zona: ${escapeHtml(order.deliveryZoneName)}`) : ''}
      ${order.notes ? field(`Notas: ${escapeHtml(order.notes)}`) : ''}
      ${separator()}

      <div class="section-title">Items:</div>
      ${renderItemLines(order, false)}
      ${separator()}
      <div class="center">Comanda de cocina · ${escapeHtml(businessName)}</div>
    </section>
  `
}

export function buildTicketPrintDocument(input: TicketPrintInput, variants: TicketVariant[]) {
  const body = variants
    .map((variant) =>
      variant === 'kitchen' ? renderKitchenTicket(input) : renderCustomerTicket(input)
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=${TICKET_WIDTH_PX}" />
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
  iframe.style.width = `${TICKET_WIDTH_PX}px`
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
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }
    }, 2000)
  }

  const triggerPrint = () => {
    if (printed) return
    printed = true

    window.setTimeout(() => {
      frameWindow.focus()
      frameWindow.print()
    }, 100)
  }

  frameWindow.addEventListener('afterprint', cleanup, { once: true })
  iframe.addEventListener('load', triggerPrint, { once: true })

  frameDocument.open()
  frameDocument.write(html)
  frameDocument.close()

  window.setTimeout(triggerPrint, 800)
  window.setTimeout(cleanup, 20000)
}
