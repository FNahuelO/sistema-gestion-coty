'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type AdminTheme = 'light' | 'dark'

const STORAGE_KEY = 'coty-admin-theme'

type AdminThemeContextValue = {
  theme: AdminTheme
  setTheme: (theme: AdminTheme) => void
  toggleTheme: () => void
}

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null)

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>('light')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') {
      setThemeState(stored)
    }
    setReady(true)
  }, [])

  const setTheme = (next: AdminTheme) => {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')

  return (
    <AdminThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <div className={cn('min-h-screen', ready && theme === 'dark' && 'dark')}>{children}</div>
    </AdminThemeContext.Provider>
  )
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext)
  if (!context) {
    throw new Error('useAdminTheme debe usarse dentro de AdminThemeProvider')
  }
  return context
}
