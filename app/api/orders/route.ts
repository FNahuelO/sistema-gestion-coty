import { NextRequest, NextResponse } from 'next/server'
import { createOrderFromPayload, getOperationalOrders, getSessionUser, requireSessionRole } from '@/lib/server-data'

export async function GET() {
  try {
    await requireSessionRole(['admin', 'cashier', 'waitress'])
    const orders = await getOperationalOrders()
    return NextResponse.json(orders)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('GET /api/orders', error)
    return NextResponse.json({ error: 'No se pudieron cargar los pedidos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sessionUser = await getSessionUser()
    const order = await createOrderFromPayload(body, sessionUser?.id)
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      const knownMessages = new Map<string, [string, number]>([
        ['BUSINESS_CLOSED', ['El local se encuentra cerrado en este momento', 400]],
        ['INVALID_PRODUCTS', ['Hay productos inválidos o no disponibles', 400]],
        ['INVALID_PRODUCT', ['Producto inválido', 400]],
        ['INVALID_OPTION', ['Opción de producto inválida', 400]],
        ['INVALID_CHOICE', ['Selección inválida', 400]],
        ['TABLE_REQUIRED', ['Debe indicar la mesa para este pedido', 400]],
        ['TABLE_NOT_FOUND', ['La mesa seleccionada no existe', 404]],
        ['SETTINGS_NOT_FOUND', ['La configuración del negocio no está lista', 500]],
      ])

      if (knownMessages.has(error.message)) {
        const [message, status] = knownMessages.get(error.message)!
        return NextResponse.json({ error: message }, { status })
      }
    }

    console.error('POST /api/orders', error)
    return NextResponse.json({ error: 'No se pudo crear el pedido' }, { status: 500 })
  }
}
