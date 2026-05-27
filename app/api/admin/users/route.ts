import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUsers, requireSessionRole, upsertUser, userInputSchema } from '@/lib/server-data'

export async function GET() {
  try {
    await requireSessionRole(['admin'])
    const users = await getAdminUsers()
    return NextResponse.json(users)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('GET /api/admin/users', error)
    return NextResponse.json({ error: 'No se pudieron cargar los usuarios' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSessionRole(['admin'])
    const user = await upsertUser(null, userInputSchema.parse(await request.json()))
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    if (error instanceof Error && error.message === 'USER_EMAIL_EXISTS') {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 400 })
    }

    if (error instanceof Error && error.message === 'USER_PASSWORD_REQUIRED') {
      return NextResponse.json({ error: 'La contraseña es obligatoria al crear un usuario' }, { status: 400 })
    }

    console.error('POST /api/admin/users', error)
    return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireSessionRole(['admin'])
    const body = await request.json()
    const user = await upsertUser(body.id, userInputSchema.parse(body))
    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    if (error instanceof Error && error.message === 'USER_EMAIL_EXISTS') {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 400 })
    }

    console.error('PUT /api/admin/users', error)
    return NextResponse.json({ error: 'No se pudo actualizar el usuario' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireSessionRole(['admin'])
    const { id } = await request.json()

    await prisma.user.update({
      where: { id },
      data: {
        active: false,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('DELETE /api/admin/users', error)
    return NextResponse.json({ error: 'No se pudo desactivar el usuario' }, { status: 500 })
  }
}
