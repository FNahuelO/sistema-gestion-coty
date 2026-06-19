'use client'

import { useCallback, useState } from 'react'
import type { FormSection } from '../types'

export function useFormPanel(sectionId: FormSection, initialOpen = false) {
  const [open, setOpen] = useState(initialOpen)

  const openPanel = useCallback(() => {
    setOpen(true)
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        document.getElementById(`admin-form-panel-${sectionId}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 120)
    })
  }, [sectionId])

  return { open, setOpen, openPanel }
}
