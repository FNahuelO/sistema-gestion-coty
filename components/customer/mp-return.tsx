'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  buildCheckoutFailureReturnUrl,
  buildOrderStatusReturnUrl,
  clearMpPendingOrder,
  clearMpRedirecting,
  getMercadoPagoReturnOrderId,
  parseMercadoPagoReturnStatus,
} from '@/lib/mercadopago-return'
import { clearStoredCart } from '@/lib/store'
import { CheckoutLoadingSkeleton } from '@/components/shared/loading'
import { COTY_HEADER } from '@/lib/coty-theme'

function MpReturnRedirect() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const orderId = getMercadoPagoReturnOrderId(searchParams)
    const paymentStatus = parseMercadoPagoReturnStatus(searchParams)

    clearMpRedirecting()

    if (paymentStatus === 'failure') {
      window.location.replace(buildCheckoutFailureReturnUrl(orderId))
      return
    }

    if (paymentStatus === 'approved') {
      clearMpPendingOrder()
      clearStoredCart()
    }

    window.location.replace(buildOrderStatusReturnUrl(searchParams, orderId))
  }, [searchParams])

  return (
    <div className="coly-landing flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <CheckoutLoadingSkeleton />
      <p className="mt-6 text-sm font-medium text-muted-foreground">Confirmando tu pago...</p>
    </div>
  )
}

export function MpReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="coly-landing flex min-h-screen items-center justify-center bg-white">
          <p className="text-sm font-medium" style={{ color: COTY_HEADER }}>
            Confirmando tu pago...
          </p>
        </div>
      }
    >
      <MpReturnRedirect />
    </Suspense>
  )
}
