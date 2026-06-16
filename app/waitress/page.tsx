'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/shared/loading'

export default function WaitressRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/staff')
  }, [router])

  return <LoadingScreen />
}
