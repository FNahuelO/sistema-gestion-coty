'use client'

import { useMemo } from 'react'
import { QrCode } from 'lucide-react'
import { NativeDialog } from '@/components/ui/native-dialog'
import { Button } from '@/components/ui/button'
import { QrCodeCard } from '@/components/admin/qr-code-card'
import { buildMenuUrl, getAppBaseUrl } from '@/lib/menu-url'
import type { Table } from '@/lib/types'

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
      className="border-[#C5DDD9] bg-white text-[#2D5A57] hover:bg-[#C5DDD9]/40"
      onClick={onClick}
    >
      <QrCode className="mr-1.5 h-3.5 w-3.5" />
      QR
    </Button>
  )
}
