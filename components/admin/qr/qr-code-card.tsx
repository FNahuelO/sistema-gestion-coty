'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Copy, Download, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  PANEL_ACCENT_TEXT,
  PANEL_BORDER,
  PANEL_LIST_ROW,
  PANEL_OUTLINE_BTN,
  PANEL_PRIMARY_BTN,
  PANEL_PROGRESS_TRACK,
  PANEL_SHELL,
  PANEL_SURFACE,
} from '@/lib/panel-theme'
import { cn } from '@/lib/utils'

const QR_SIZE = 256
const PRINT_QR_SIZE = 1024

type QrCodeCardProps = {
  url: string
  title: string
  description?: string
  downloadFilename: string
  printLabel?: string
  className?: string
}

async function generateQrDataUrl(value: string, size: number) {
  return QRCode.toDataURL(value, {
    width: size,
    margin: 2,
    color: { dark: '#053E38', light: '#FFFFFF' },
  })
}

async function downloadPrintableQr(url: string, filename: string, label: string) {
  const qrDataUrl = await generateQrDataUrl(url, PRINT_QR_SIZE)
  const image = new Image()
  image.src = qrDataUrl
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('No se pudo generar la imagen'))
  })

  const padding = 80
  const labelHeight = 120
  const canvas = document.createElement('canvas')
  canvas.width = PRINT_QR_SIZE + padding * 2
  canvas.height = PRINT_QR_SIZE + padding * 2 + labelHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('No se pudo preparar la descarga')

  context.fillStyle = '#FFFFFF'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, padding, padding, PRINT_QR_SIZE, PRINT_QR_SIZE)

  context.fillStyle = '#053E38'
  context.font = 'bold 48px system-ui, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(label, canvas.width / 2, PRINT_QR_SIZE + padding * 2 + labelHeight / 2)

  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = filename
  link.click()
}

export function QrCodeCard({
  url,
  title,
  description,
  downloadFilename,
  printLabel,
  className,
}: QrCodeCardProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    let cancelled = false

    void generateQrDataUrl(url, QR_SIZE)
      .then((next) => {
        if (!cancelled) setDataUrl(next)
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null)
      })

    return () => {
      cancelled = true
    }
  }, [url])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado')
    } catch {
      toast.error('No se pudo copiar el link')
    }
  }

  const downloadQr = async (printable: boolean) => {
    setIsDownloading(true)
    try {
      if (printable && printLabel) {
        await downloadPrintableQr(url, downloadFilename, printLabel)
        toast.success('QR listo para imprimir')
        return
      }

      const png = await generateQrDataUrl(url, PRINT_QR_SIZE)
      const link = document.createElement('a')
      link.href = png
      link.download = downloadFilename
      link.click()
      toast.success('QR descargado')
    } catch {
      toast.error('No se pudo descargar el QR')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className={cn('rounded-xl border p-4', PANEL_BORDER, PANEL_SURFACE, className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className={cn('mx-auto flex h-40 w-40 shrink-0 items-center justify-center rounded-xl p-3 shadow-sm sm:mx-0', PANEL_SHELL)}>
          {dataUrl ? (
            <img src={dataUrl} alt={`QR ${title}`} className="h-full w-full object-contain" />
          ) : (
            <div className={cn('h-full w-full animate-pulse rounded-lg', PANEL_PROGRESS_TRACK)} />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className={PANEL_ACCENT_TEXT}>{title}</p>
            {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
          </div>

          <p className={cn('break-all rounded-lg border px-3 py-2 text-xs text-muted-foreground', PANEL_LIST_ROW)}>
            {url}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" className={PANEL_OUTLINE_BTN} onClick={() => void copyLink()}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copiar link
            </Button>
            <Button type="button" size="sm" variant="outline" className={PANEL_OUTLINE_BTN} onClick={() => window.open(url, '_blank')}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Abrir
            </Button>
            <Button
              type="button"
              size="sm"
              className={PANEL_PRIMARY_BTN}
              disabled={isDownloading}
              onClick={() => void downloadQr(false)}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Descargar PNG
            </Button>
            {printLabel ? (
              <Button
                type="button"
                size="sm"
                className={PANEL_PRIMARY_BTN}
                disabled={isDownloading}
                onClick={() => void downloadQr(true)}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Para imprimir
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
