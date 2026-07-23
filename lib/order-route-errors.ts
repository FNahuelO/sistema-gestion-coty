import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { isSchemaMismatchError, schemaMismatchResponse } from '@/lib/api-route-errors'

const ORDER_ERROR_MESSAGES = new Map<string, [string, number]>([
  ['BUSINESS_CLOSED', ['El local se encuentra cerrado en este momento', 400]],
  ['CHANNEL_CLOSED', ['Este canal no está disponible en este horario', 400]],
  ['INVALID_PRODUCTS', ['Hay productos inválidos o no disponibles', 400]],
  ['INVALID_PRODUCT', ['Producto inválido', 400]],
  ['INVALID_OPTION', ['Opción de producto inválida', 400]],
  ['INVALID_CHOICE', ['Selección inválida', 400]],
  ['REQUIRED_OPTION', ['Debe seleccionar todas las opciones obligatorias', 400]],
  ['INVALID_OPTION_SELECTION', ['Selección de opción inválida', 400]],
  ['TABLE_REQUIRED', ['Debe indicar la mesa para este pedido', 400]],
  ['TABLE_NOT_FOUND', ['La mesa seleccionada no existe', 404]],
  ['TABLE_UNAVAILABLE', ['La mesa seleccionada no está disponible', 400]],
  ['TABLE_SESSION_NOT_FOUND', ['La mesa no tiene una sesión abierta. Ocupá la mesa o cargá un pedido antes de cobrar.', 400]],
  ['OUT_OF_STOCK', ['No hay stock suficiente para uno o más productos', 400]],
  ['SETTINGS_NOT_FOUND', ['La configuración del negocio no está lista', 500]],
  ['MIN_ORDER_AMOUNT', ['El pedido no alcanza el monto mínimo requerido', 400]],
  ['MERCADOPAGO_UNAVAILABLE', ['Mercado Pago no está disponible en este momento', 400]],
  ['PAYMENT_NOT_APPROVED', ['Debés aprobar el comprobante de transferencia antes de confirmar el pedido', 400]],
  [
    'DAILY_ORDER_NUMBER_FAILED',
    ['No se pudo asignar el número de pedido del día. Revisá que las migraciones estén aplicadas.', 500],
  ],
  [
    'SCHEMA_OUT_OF_DATE',
    [
      'La base de datos no está actualizada. Ejecutá `pnpm db:migrate:deploy` en producción y volvé a intentar.',
      503,
    ],
  ],
])

export function handleOrderRouteError(error: unknown, context: string) {
  if (error instanceof ZodError) {
    const issueMessage = error.errors[0]?.message ?? 'Datos del pedido inválidos'
    if (ORDER_ERROR_MESSAGES.has(issueMessage)) {
      const [message, status] = ORDER_ERROR_MESSAGES.get(issueMessage)!
      return NextResponse.json({ error: message }, { status })
    }
    return NextResponse.json({ error: issueMessage }, { status: 400 })
  }

  if (isSchemaMismatchError(error)) {
    console.error(`${context} SCHEMA_OUT_OF_DATE`, error)
    return schemaMismatchResponse()
  }

  if (error instanceof Error) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    if (ORDER_ERROR_MESSAGES.has(error.message)) {
      const [message, status] = ORDER_ERROR_MESSAGES.get(error.message)!
      return NextResponse.json({ error: message, code: error.message }, { status })
    }
  }

  console.error(context, error)
  return NextResponse.json({ error: 'No se pudo procesar el pedido' }, { status: 500 })
}
