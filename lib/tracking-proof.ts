import { createHmac, timingSafeEqual } from 'crypto'

function getTrackingProofSecret() {
  return process.env.TRACKING_PROOF_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'coty-dev-tracking-proof'
}

export function createTrackingProof(orderId: string, publicTrackingCode: string) {
  return createHmac('sha256', getTrackingProofSecret())
    .update(`${orderId}:${publicTrackingCode}`)
    .digest('hex')
}

export function verifyTrackingProof(orderId: string, publicTrackingCode: string, proof: string) {
  if (!proof || !publicTrackingCode) return false

  const expected = createTrackingProof(orderId, publicTrackingCode)

  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(proof, 'hex'))
  } catch {
    return false
  }
}
