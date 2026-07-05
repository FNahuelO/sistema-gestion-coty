import { formatDateAR, formatTimeAR, formatDateTimeAR } from '@/lib/datetime'
import { formatPrice } from '@/lib/coty-theme'
import { getPaymentStatusLabel, ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/order-labels'
import type { Order } from '@/lib/types'

export type TicketVariant = 'kitchen' | 'customer'

export type TicketPrintInput = {
  order: Order
  businessName: string
}

const TICKET_STYLES = `
  @page { size: 80mm auto; margin: 2mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    color: #000;
    background: #fff;
    font-family: "Courier New", Courier, monospace;
    font-size: 14px;
    line-height: 1.4;
  }
  .ticket {
    width: 76mm;
    margin: 0 auto;
    padding: 2mm 0;
    page-break-after: always;
  }
  .ticket:last-child { page-break-after: auto; }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .line {
    border-top: 1px dashed #000;
    margin: 8px 0;
  }
  .row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .section-title { font-size: 15px; font-weight: 700; margin-top: 4px; }
  .item-title { font-size: 14px; margin-top: 5px; }
  .addon { padding-left: 10px; font-size: 13px; }
  .small { font-size: 12px; }
  .header-title { font-size: 17px; font-weight: 700; letter-spacing: 0.5px; }
  .business-name { font-size: 19px; font-weight: 700; margin-top: 2px; }
  .order-code { font-size: 16px; font-weight: 700; margin-top: 4px; }
  .total-row { font-size: 16px; }
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

function getItemUnitPrice(item: Order['items'][number]) {
  return item.unitPrice ?? item.product.price
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

      return `
        <div class="item-title row">
          <span>• ${escapeHtml(item.product.name)} (x${item.quantity})</span>
          ${showPrices ? `<span>${priceLabel}</span>` : ''}
        </div>
        ${addonsTitle}
        ${addons}
        ${item.notes ? `<div class="addon small">Nota: ${escapeHtml(item.notes)}</div>` : ''}
      `
    })
    .join('')
}

function renderCustomerTicket({ order, businessName }: TicketPrintInput) {
  const createdAt = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt)
  const paymentStatus = getPaymentStatusLabel(order) || '—'
  const productsTotal = order.items.reduce(
    (sum, item) => sum + getItemUnitPrice(item) * item.quantity,
    0
  )
  const showCashTender = order.paymentMethod === 'cash'

  return `
    <section class="ticket">
      <div class="center header-title">*** TICKET ***</div>
      <div class="center business-name">${escapeHtml(businessName)}</div>
      <div class="center order-code">Orden ${escapeHtml(getOrderLabel(order))}</div>
      <div class="line"></div>

      <div>Modalidad: ${escapeHtml(ORDER_TYPE_LABELS[order.type])}</div>
      <div>Medio de pago: ${escapeHtml(PAYMENT_METHOD_LABELS[order.paymentMethod])}</div>
      <div>Estado: ${escapeHtml(paymentStatus)}</div>
      <div>Fecha: ${formatDateAR(createdAt)}</div>
      <div>Hora: ${formatTimeAR(createdAt)}</div>
      <div class="line"></div>

      <div class="section-title">Datos del cliente:</div>
      <div>Nombre: ${escapeHtml(order.customerName)}</div>
      ${order.customerAddress ? `<div>Dirección: ${escapeHtml(order.customerAddress)}</div>` : ''}
      ${order.deliveryZoneName ? `<div>Zona de envío: ${escapeHtml(order.deliveryZoneName)}</div>` : ''}
      ${order.notes ? `<div>Información adicional: ${escapeHtml(order.notes)}</div>` : ''}
      ${order.customerPhone && order.customerPhone !== 'mesa' ? `<div>Teléfono: ${escapeHtml(order.customerPhone)}</div>` : ''}
      ${order.tableNumber ? `<div>Mesa: ${order.tableNumber}</div>` : ''}
      <div class="line"></div>

      <div class="row bold">
        <span>Items:</span>
        <span>Precio Unit.</span>
      </div>
      ${renderItemLines(order, true)}
      <div class="line"></div>

      <div class="row"><span>Total de productos:</span><span>${formatPrice(productsTotal)}</span></div>
      ${order.deliveryFee ? `<div class="row"><span>Envío:</span><span>${formatPrice(order.deliveryFee)}</span></div>` : ''}
      ${order.discountAmount ? `<div class="row"><span>Descuento:</span><span>-${formatPrice(order.discountAmount)}</span></div>` : ''}
      ${order.tip ? `<div class="row"><span>Propina:</span><span>${formatPrice(order.tip)}</span></div>` : ''}
      <div class="row total-row bold"><span>TOTAL:</span><span>${formatPrice(order.total)}</span></div>
      ${showCashTender ? `<div class="row"><span>Pagará con:</span><span>${formatPrice(order.total)}</span></div>` : ''}
      ${showCashTender ? `<div class="row"><span>Vuelto:</span><span>${formatPrice(0)}</span></div>` : ''}
      <div class="line"></div>
      <div class="center small">${escapeHtml(businessName)}</div>
    </section>
  `
}

function renderKitchenTicket({ order, businessName }: TicketPrintInput) {
  const createdAt = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt)

  return `
    <section class="ticket">
      <div class="center header-title">*** COCINA ***</div>
      <div class="center business-name">${escapeHtml(businessName)}</div>
      <div class="center order-code">Orden ${escapeHtml(getOrderLabel(order))}</div>
      <div class="line"></div>

      <div class="bold">${escapeHtml(ORDER_TYPE_LABELS[order.type])}${order.tableNumber ? ` · Mesa ${order.tableNumber}` : ''}</div>
      <div>Hora: ${formatDateTimeAR(createdAt)}</div>
      <div>Cliente: ${escapeHtml(order.customerName)}</div>
      ${order.customerAddress ? `<div>Dirección: ${escapeHtml(order.customerAddress)}</div>` : ''}
      ${order.deliveryZoneName ? `<div>Zona: ${escapeHtml(order.deliveryZoneName)}</div>` : ''}
      ${order.notes ? `<div>Notas del pedido: ${escapeHtml(order.notes)}</div>` : ''}
      <div class="line"></div>

      <div class="section-title">Items:</div>
      ${renderItemLines(order, false)}
      <div class="line"></div>
      <div class="center small">Comanda de cocina · ${escapeHtml(businessName)}</div>
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
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const frameWindow = iframe.contentWindow
  const frameDocument = iframe.contentDocument
  if (!frameWindow || !frameDocument) {
    document.body.removeChild(iframe)
    return
  }

  frameDocument.open()
  frameDocument.write(html)
  frameDocument.close()

  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }
    }, 500)
  }

  frameWindow.focus()
  frameWindow.print()
  cleanup()
}
