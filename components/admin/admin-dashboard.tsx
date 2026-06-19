'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/lib/store'
import { canAccessAdminSection, getDefaultAdminSection } from '@/lib/permissions'
import { AdminShell } from './admin-shell'
import { CategoriesSection } from './sections/categories-section'
import { DashboardSection } from './sections/dashboard-section'
import { ProductsSection } from './sections/products-section'
import { PromotionsSection } from './sections/promotions-section'
import { SchedulesSection } from './sections/schedules-section'
import { SettingsSection } from './sections/settings-section'
import { TablesSection } from './sections/tables-section'
import { UsersSection } from './sections/users-section'
import { CashSection } from './sections/cash-section'
import { CommerceSection } from './sections/commerce-section'
import type { AdminSection } from './types'

const SECTIONS: Record<AdminSection, () => ReactNode> = {
  dashboard: () => <DashboardSection />,
  products: () => <ProductsSection />,
  categories: () => <CategoriesSection />,
  promotions: () => <PromotionsSection />,
  tables: () => <TablesSection />,
  users: () => <UsersSection />,
  schedules: () => <SchedulesSection />,
  cash: () => <CashSection />,
  commerce: () => <CommerceSection />,
  settings: () => <SettingsSection />,
}

export function AdminDashboard() {
  const { user } = useAuth()
  const roleContext = useMemo(
    () => ({
      role: user?.role === 'admin' ? 'admin' as const : 'staff' as const,
      staffRole: user?.staffRole ?? null,
    }),
    [user]
  )

  const [activeSection, setActiveSection] = useState<AdminSection>(() => getDefaultAdminSection(roleContext))

  useEffect(() => {
    if (!canAccessAdminSection(roleContext, activeSection)) {
      setActiveSection(getDefaultAdminSection(roleContext))
    }
  }, [activeSection, roleContext])

  const Section = SECTIONS[activeSection]

  return (
    <AdminShell activeSection={activeSection} onSectionChange={setActiveSection} roleContext={roleContext}>
      {Section()}
    </AdminShell>
  )
}
