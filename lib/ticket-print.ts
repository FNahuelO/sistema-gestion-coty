import { formatDateAR, formatTimeAR, formatDateTimeAR } from '@/lib/datetime'
import { formatPrice } from '@/lib/coty-theme'
import { getPaymentStatusLabel, ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/order-labels'
import type { Order } from '@/lib/types'

export type TicketVariant = 'kitchen' | 'customer'

export type TicketPrintInput = {
  order: Order
  businessName: string
}

/** Impresora del cliente: Nexuspös X-NX 58II UB (papel 58 mm). */
const TICKET_PAPER_MM = 58
const TICKET_CONTENT_MM = 48
const SEPARATOR_LINE = '--------------------------'

const TICKET_STYLES = `
  @page {
    size: ${TICKET_PAPER_MM}mm auto;
    margin: 0;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    padding: 0;
    color: #000;
    background: #fff;
    font-family: "Courier New", Courier, monospace;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.3;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    -webkit-font-smoothing: none;
    font-smooth: never;
  }

  .ticket {
    width: ${TICKET_CONTENT_MM}mm;
    max-width: ${TICKET_CONTENT_MM}mm;
    margin: 0 auto;
    padding: 2mm 1mm;
    page-break-after: always;
    overflow: hidden;
  }

  .ticket:last-child { page-break-after: auto; }

  .center { text-align: center; }
  .bold { font-weight: 700; }
  .separator {
    margin: 2mm 0;
    font-size: 11px;
    letter-spacing: 0;
    overflow: hidden;
    white-space: nowrap;
  }
  .row {
    display: table;
    width: 100%;
    table-layout: fixed;
    margin: 1px 0;
  }
  .row > span {
    display: table-cell;
    vertical-align: top;
  }
  .row-left {
    width: 62%;
    word-break: break-word;
    overflow-wrap: break-word;
    padding-right: 1mm;
  }
  .row-right {
    width: 38%;
    text-align: right;
    white-space: nowrap;
  }
  .section-title { font-weight: 700; margin-top: 1mm; }
  .item-line { margin-top: 1mm; }
  .addon { padding-left: 2mm; font-size: 10px; }
  .header-title { font-size: 12px; font-weight: 700; }
  .business-name { font-size: 13px; font-weight: 700; margin-top: 1mm; }
  .order-code { font-size: 11px; font-weight: 700; margin-top: 1mm; }
  .field {
    margin: 1px 0;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  @media print {
    body { background: #fff; color: #000; }
    .ticket { width: ${TICKET_CONTENT_MM}mm; max-width: ${TICKET_CONTENT_MM}mm; }
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

function row(left: string, right?: string) {
  if (!right) return `<div class="field">${left}</div>`
  return `<div class="row"><span class="row-left">${left}</span><span class="row-right">${right}</span></div>`
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
              const priceLabel = showPrices ? ` ${formatPrice(addonPrice)}` : ''
              return `<div class="addon">• ${escapeHtml(selection.choiceName)} (x${item.quantity})${priceLabel}</div>`
            })
            .join('')
        : ''

      const priceLabel = showPrices ? formatPrice(lineTotal) : ''
      const addonsTitle = addons ? '<div class="addon section-title">Adicionales:</div>' : ''
      const itemName = `• ${escapeHtml(item.product.name)} (x${item.quantity})`

      return `
        ${showPrices ? row(itemName, priceLabel) : `<div class="item-line field">${itemName}</div>`}
        ${addonsTitle}
        ${addons}
        ${item.notes ? `<div class="addon">Nota: ${escapeHtml(item.notes)}</div>` : ''}
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

      <div class="field">Modalidad: ${escapeHtml(ORDER_TYPE_LABELS[order.type])}</div>
      <div class="field">Medio de pago: ${escapeHtml(PAYMENT_METHOD_LABELS[order.paymentMethod])}</div>
      <div class="field">Estado: ${escapeHtml(getTicketPaymentStatus(order))}</div>
      <div class="field">Fecha: ${formatDateAR(createdAt)}</div>
      <div class="field">Hora: ${formatTimeAR(createdAt)}</div>
      ${separator()}

      <div class="section-title">Datos del cliente:</div>
      <div class="field">-Nombre: ${escapeHtml(order.customerName)}</div>
      ${order.customerAddress ? `<div class="field">-Dirección: ${escapeHtml(order.customerAddress)}</div>` : ''}
      ${order.deliveryZoneName ? `<div class="field">-Zona de envío: ${escapeHtml(order.deliveryZoneName)}</div>` : ''}
      ${order.customerPhone && order.customerPhone !== 'mesa' ? `<div class="field">-Teléfono: ${escapeHtml(order.customerPhone)}</div>` : ''}
      ${order.tableNumber ? `<div class="field">-Mesa: ${order.tableNumber}</div>` : ''}
      ${separator()}

      ${row('Items:', 'Precio Unit.')}
      ${renderItemLines(order, true)}
      ${separator()}

      <div class="field">Total de productos: ${formatPrice(productsTotal)}</div>
      ${order.deliveryFee ? `<div class="field">Envío: ${formatPrice(order.deliveryFee)}</div>` : ''}
      ${order.discountAmount ? `<div class="field">Descuento: -${formatPrice(order.discountAmount)}</div>` : ''}
      ${order.tip ? `<div class="field">Propina: ${formatPrice(order.tip)}</div>` : ''}
      <div class="field bold">TOTAL: ${formatPrice(order.total)}</div>
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

      <div class="field bold">${escapeHtml(ORDER_TYPE_LABELS[order.type])}${order.tableNumber ? ` · Mesa ${order.tableNumber}` : ''}</div>
      <div class="field">Hora: ${formatDateTimeAR(createdAt)}</div>
      <div class="field">Cliente: ${escapeHtml(order.customerName)}</div>
      ${order.customerAddress ? `<div class="field">Dirección: ${escapeHtml(order.customerAddress)}</div>` : ''}
      ${order.deliveryZoneName ? `<div class="field">Zona: ${escapeHtml(order.deliveryZoneName)}</div>` : ''}
      ${order.notes ? `<div class="field">Notas: ${escapeHtml(order.notes)}</div>` : ''}
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
    <meta name="viewport" content="width=${TICKET_PAPER_MM * 3.78}" />
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
  iframe.style.left = '-10000px'
  iframe.style.top = '0'
  iframe.style.width = `${TICKET_PAPER_MM}mm`
  iframe.style.height = '100vh'
  iframe.style.border = '0'
  iframe.style.visibility = 'hidden'
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
    }, 1500)
  }

  const triggerPrint = () => {
    if (printed) return
    printed = true

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        frameWindow.focus()
        frameWindow.print()
      })
    })
  }

  frameWindow.addEventListener('afterprint', cleanup, { once: true })
  iframe.addEventListener('load', triggerPrint, { once: true })

  frameDocument.open()
  frameDocument.write(html)
  frameDocument.close()

  window.setTimeout(triggerPrint, 400)
  window.setTimeout(cleanup, 15000)
}
