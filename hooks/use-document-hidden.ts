'use client'

import { useEffect, useState } from 'react'

/** `true` cuando la pestaña está en segundo plano (document.hidden). */
export function useDocumentHidden() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const update = () => setHidden(document.hidden)
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return hidden
}
