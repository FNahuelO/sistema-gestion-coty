import type { Promotion } from '@/lib/types'

export function parsePromotion(
  promotion: Promotion & { validFrom: string | Date; validTo: string | Date }
): Promotion {
  return {
    ...promotion,
    validFrom: new Date(promotion.validFrom),
    validTo: new Date(promotion.validTo),
  }
}
