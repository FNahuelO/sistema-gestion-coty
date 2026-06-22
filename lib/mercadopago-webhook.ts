import { createHmac, timingSafeEqual } from 'crypto'

function parseSignatureHeader(header: string | null) {
  if (!header) return null

  const parts = Object.fromEntries(
    header.split(',').map((part) => {
      const [key, value] = part.trim().split('=')
      return [key, value]
    })
  ) as { ts?: string; v1?: string }

  if (!parts.ts || !parts.v1) return null
  return parts
}

export function verifyMercadoPagoWebhookSignature(input: {
  signatureHeader: string | null
  requestId: string | null
  dataId: string
  secret: string
}) {
  const parsed = parseSignatureHeader(input.signatureHeader)
  if (!parsed) return false

  const manifest = `id:${input.dataId};request-id:${input.requestId ?? ''};ts:${parsed.ts};`
  const expected = createHmac('sha256', input.secret).update(manifest).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(parsed.v1, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return parsed.v1 === expected
  }
}

export function shouldVerifyMercadoPagoWebhook() {
  return Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET)
}
