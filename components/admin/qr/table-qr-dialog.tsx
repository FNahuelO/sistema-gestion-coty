'use client'

import { useMemo } from 'react'
import { QrCode } from 'lucide-react'
import { NativeDialog } from '@/components/ui/native-dialog'
import { Button } from '@/components/ui/button'
import { QrCodeCard } from '@/components/admin/qr/qr-code-card'
import { buildMenuUrl, getAppBaseUrl } from '@/lib/menu-url'
import type { Table } from '@/lib/types'
import { PANEL_OUTLINE_BTN } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'

type TableQrDialogProps = {
  table: Table | null
  businessName: string
  onClose: () => void
}

export function TableQrDialog({ table, businessName, onClose }: TableQrDialogProps) {
  const baseUrl = useMemo(() => getAppBaseUrl(), [])
  const menuUrl = table ? buildMenuUrl(baseUrl, { tableId: table.id }) : ''
  const printLabel = table ? `Mesa ${table.number} · ${businessName}` : businessName

  return (
    <NativeDialog
      open={Boolean(table)}
      onOpenChange={(open) => !open && onClose()}
      title={table ? `QR Mesa ${table.number}` : 'Código QR'}
      description="Escaneá este código para abrir el menú con la mesa identificada."
      maxWidthClassName="max-w-lg"
    >
      {table ? (
        <QrCodeCard
          url={menuUrl}
          title={`Menú · Mesa ${table.number}`}
          description="Ideal para imprimir y colocar en la mesa."
          downloadFilename={`mesa-${table.number}-qr.png`}
          printLabel={printLabel}
        />
      ) : null}
    </NativeDialog>
  )
}

type TableQrButtonProps = {
  onClick: () => void
}

export function TableQrButton({ onClick }: TableQrButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('h-9 min-h-[44px] px-3 sm:h-8 sm:min-h-0', PANEL_OUTLINE_BTN)}
      onClick={onClick}
    >
      <QrCode className="mr-1.5 h-3.5 w-3.5" />
      QR
    </Button>
  )
}
