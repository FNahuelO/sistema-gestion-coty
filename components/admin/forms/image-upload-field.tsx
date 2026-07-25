'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PANEL_BORDER, PANEL_OUTLINE_BTN, PANEL_SURFACE } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import { LoadingImage } from '@/components/shared/loading-image'

type UploadFolder = 'products' | 'promotions' | 'settings' | 'users'

type ImageUploadFieldProps = {
  value: string
  onChange: (url: string) => void
  folder: UploadFolder
  className?: string
}

const OUTLINE_BTN = PANEL_OUTLINE_BTN

export function ImageUploadField({ value, onChange, folder, className }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [showUrl, setShowUrl] = useState(Boolean(value && !value.includes('res.cloudinary.com')))

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? 'No se pudo subir la imagen')
      }

      onChange(data.url)
      setShowUrl(false)
      toast.success('Imagen subida correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al subir la imagen')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void handleUpload(file)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-start gap-3">
        <div className={cn('relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border', PANEL_BORDER, PANEL_SURFACE)}>
          {value ? (
            <>
              <LoadingImage src={value} alt="" />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
                aria-label="Quitar imagen"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onFileChange}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={OUTLINE_BTN}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              'Subir imagen'
            )}
          </Button>
          <button
            type="button"
            className="text-left text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => setShowUrl((previous) => !previous)}
          >
            {showUrl ? 'Ocultar URL' : 'Usar URL externa'}
          </button>
        </div>
      </div>

      {showUrl ? (
        <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="https://..." />
      ) : null}
    </div>
  )
}
