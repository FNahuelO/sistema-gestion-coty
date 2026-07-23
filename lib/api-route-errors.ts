import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

const SCHEMA_HINT =
  'La base de datos no está actualizada. Ejecutá `pnpm db:migrate:deploy` en producción y volvé a intentar.'

export function isSchemaMismatchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : ''

  if (code === 'P2021' || code === 'P2022' || code === '42P01' || code === '42703') {
    return true
  }

  return (
    message.includes('does not exist') ||
    message.includes('no existe') ||
    message.includes('unknown column') ||
    message.includes('dailyordercounter') ||
    message.includes('column "priority"') ||
    message.includes('column "dailynumber"') ||
    message.includes('column "servicedate"')
  )
}

export function schemaMismatchResponse() {
  return NextResponse.json(
    {
      error: SCHEMA_HINT,
      code: 'SCHEMA_OUT_OF_DATE',
    },
    { status: 503 }
  )
}

const COMMON_AUTH_ERRORS = new Map<string, [string, number]>([
  ['UNAUTHORIZED', ['No autenticado', 401]],
  ['FORBIDDEN', ['Sin permisos', 403]],
])

/** Resuelve errores comunes de auth/schema/Zod; si no aplica, retorna null. */
export function resolveCommonRouteError(error: unknown): NextResponse | null {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.errors[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    )
  }

  if (isSchemaMismatchError(error)) {
    console.error('SCHEMA_OUT_OF_DATE', error)
    return schemaMismatchResponse()
  }

  if (error instanceof Error && COMMON_AUTH_ERRORS.has(error.message)) {
    const [message, status] = COMMON_AUTH_ERRORS.get(error.message)!
    return NextResponse.json({ error: message }, { status })
  }

  return null
}
