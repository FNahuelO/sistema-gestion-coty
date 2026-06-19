import { NextResponse } from 'next/server'

export function handleRouteError(error: unknown, context: string) {
  if (error instanceof Error && error.message === 'UNAUTHORIZED') {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if (error instanceof Error && error.message === 'FORBIDDEN') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  console.error(context, error)
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
}
