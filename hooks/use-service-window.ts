'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import {
  SERVICE_MARGIN_AFTER_MINUTES,
  SERVICE_MARGIN_BEFORE_MINUTES,
} from '@/lib/adaptive-polling'
import { isWithinServiceWindow, type ChannelScheduleInput } from '@/lib/channel-hours'
import type { BusinessSettings } from '@/lib/types'

type CatalogHoursPayload = {
  settings: BusinessSettings | null
  schedules?: ChannelScheduleInput[]
}

const fetchCatalogHours = async (url: string): Promise<CatalogHoursPayload> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

/**
 * `true`/`false` según el horario de atención (general + canales) con margen;
 * `null` mientras no se conoce. Se reevalúa cada minuto sin consultar la base.
 */
export function useInServiceWindow(enabled = true): boolean | null {
  const { data } = useSWR<CatalogHoursPayload>(enabled ? '/api/catalog' : null, fetchCatalogHours, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  })
  const [inService, setInService] = useState<boolean | null>(null)

  useEffect(() => {
    const settings = data?.settings
    if (!enabled || !settings) {
      setInService(null)
      return
    }

    const sync = () =>
      setInService(
        isWithinServiceWindow(
          new Date(),
          settings,
          data.schedules ?? [],
          SERVICE_MARGIN_BEFORE_MINUTES,
          SERVICE_MARGIN_AFTER_MINUTES
        )
      )
    sync()
    const id = window.setInterval(sync, 60_000)
    return () => window.clearInterval(id)
  }, [data, enabled])

  return inService
}
