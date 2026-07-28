import { useCallback, useRef, useState } from 'react'

export function usePendingAction() {
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const pendingRef = useRef<string | null>(null)

  const run = useCallback(async <T,>(key: string, action: () => Promise<T>): Promise<T | undefined> => {
    if (pendingRef.current !== null) return undefined
    pendingRef.current = key
    setPendingKey(key)
    try {
      return await action()
    } finally {
      pendingRef.current = null
      setPendingKey(null)
    }
  }, [])

  const isPending = useCallback((key: string) => pendingKey === key, [pendingKey])

  return {
    pendingKey,
    isPending,
    isBusy: pendingKey !== null,
    run,
  }
}
