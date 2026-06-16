'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // El SW es opcional; la app sigue con caché en localStorage
    })
  }, [])

  return null
}
