import { NextRequest, NextResponse } from 'next/server'
import { isCloudinaryConfigured, uploadImageBuffer } from '@/lib/cloudinary'
import { requireSessionRole } from '@/lib/server-data'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const ALLOWED_FOLDERS = new Set(['products', 'promotions', 'settings', 'users'])

export async function POST(request: NextRequest) {
  try {
    await requireSessionRole(['admin'])

    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ error: 'Cloudinary no está configurado' }, { status: 503 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const folderName = String(formData.get('folder') ?? 'products')

    if (!ALLOWED_FOLDERS.has(folderName)) {
      return NextResponse.json({ error: 'Carpeta de destino inválida' }, { status: 400 })
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Solo se permiten imágenes JPG, PNG, WebP o GIF' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'La imagen no puede superar 5 MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadImageBuffer(buffer, { folder: `coty-cafe/${folderName}` })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    if (error instanceof Error && error.message === 'CLOUDINARY_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Cloudinary no está configurado' }, { status: 503 })
    }

    console.error('POST /api/admin/upload', error)
    return NextResponse.json({ error: 'No se pudo subir la imagen' }, { status: 500 })
  }
}
