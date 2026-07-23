import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { getOrderHistory, requireSessionRole } from '@/lib/server-data'

export async function GET(request: NextRequest) {
  try {
    await requireSessionRole(['admin'])
    const format = new URL(request.url).searchParams.get('format') === 'csv' ? 'csv' : 'xlsx'
    const orders = await getOrderHistory()

    const orderRows = orders.map((order) => ({
      numero: order.dailyNumber ?? '',
      codigo: order.displayCode ?? order.id,
      tracking: order.publicTrackingCode ?? '',
      tipo: order.type,
      estado: order.status,
      pago: order.paymentMethod,
      estadoPago: order.paymentStatus ?? 'pending',
      cliente: order.customerName,
      telefono: order.customerPhone,
      mesa: order.tableNumber ?? '',
      subtotal: order.subtotal,
      impuestos: order.tax,
      delivery: order.deliveryFee ?? 0,
      total: order.total,
      creado: order.createdAt.toISOString(),
      actualizado: order.updatedAt.toISOString(),
    }))

    const itemRows = orders.flatMap((order) =>
      order.items.map((item) => ({
        numeroPedido: order.dailyNumber ?? '',
        codigoPedido: order.displayCode ?? order.id,
        producto: item.product.name,
        cantidad: item.quantity,
        precioUnitario: item.product.price,
        subtotal: item.product.price * item.quantity,
        notas: item.notes ?? '',
      }))
    )

    const ordersSheet = XLSX.utils.json_to_sheet(orderRows)
    const itemsSheet = XLSX.utils.json_to_sheet(itemRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Pedidos')
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Items')
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: format,
    })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          format === 'csv'
            ? 'text/csv; charset=utf-8'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="ventas-coty-cafe.${format}"`,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('GET /api/admin/exports/sales', error)
    return NextResponse.json({ error: 'No se pudo exportar el reporte' }, { status: 500 })
  }
}
