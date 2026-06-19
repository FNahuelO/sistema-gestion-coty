'use client'

import { useMemo } from 'react'
import { QrCodeCard } from '@/components/admin/qr/qr-code-card'
import { buildHomeUrl, buildMenuUrl, getAppBaseUrl } from '@/lib/menu-url'

type MenuQrSectionProps = {
  businessName: string
}

export function MenuQrSection({ businessName }: MenuQrSectionProps) {
  const baseUrl = useMemo(() => getAppBaseUrl(), [])
  const menuUrl = buildMenuUrl(baseUrl)
  const homeUrl = buildHomeUrl(baseUrl)
  const safeName = businessName.trim() || 'menu'

  return (
    <div className="space-y-4">
      <QrCodeCard
        url={menuUrl}
        title="Menú digital"
        description="QR general para mostrador, vidriera o redes. Lleva directo al menú."
        downloadFilename={`${safeName.toLowerCase().replace(/\s+/g, '-')}-menu-qr.png`}
        printLabel={`Menú · ${businessName}`}
      />
      <QrCodeCard
        url={homeUrl}
        title="Página de inicio"
        description="QR con la landing del local (horarios, promos y acceso al menú)."
        downloadFilename={`${safeName.toLowerCase().replace(/\s+/g, '-')}-inicio-qr.png`}
        printLabel={businessName}
      />
    </div>
  )
}
