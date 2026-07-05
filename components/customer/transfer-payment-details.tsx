'use client'

import { Building2, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/coty-theme'
import { cn } from '@/lib/utils'

type TransferPaymentDetailsProps = {
  transferAlias?: string
  transferCbu?: string
  total?: number
  className?: string
  compact?: boolean
}

function copyToClipboard(value: string, label: string) {
  void navigator.clipboard.writeText(value).then(
    () => toast.success(`${label} copiado`),
    () => toast.error('No se pudo copiar')
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-semibold text-foreground">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => copyToClipboard(value, label)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/8 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
        aria-label={`Copiar ${label}`}
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  )
}

export function TransferPaymentDetails({
  transferAlias,
  transferCbu,
  total,
  className,
  compact = false,
}: TransferPaymentDetailsProps) {
  const alias = transferAlias?.trim()
  const cbu = transferCbu?.trim()
  const hasDetails = Boolean(alias || cbu)

  if (!hasDetails && total == null) return null

  return (
    <div
      className={cn(
        'rounded-2xl border border-emerald-200 bg-emerald-50 p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-bold text-foreground">Datos para transferir</p>
            {!compact ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Transferí el total del pedido a la siguiente cuenta y enviá el comprobante por WhatsApp.
              </p>
            ) : null}
          </div>

          {total != null ? (
            <div className="rounded-xl bg-white/80 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">Monto a transferir</p>
              <p className="text-lg font-bold text-foreground">{formatPrice(total)}</p>
            </div>
          ) : null}

          {alias ? <DetailRow label="Alias / CVU" value={alias} /> : null}
          {cbu ? <DetailRow label="CBU" value={cbu} /> : null}

          {!hasDetails ? (
            <p className="text-sm text-amber-800">
              El local aún no cargó los datos de transferencia. Consultá por WhatsApp antes de pagar.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
