'use client'

import { useState } from 'react'
import { CashierDashboard } from '@/components/cashier/orders-dashboard'
import { WaitressPanel } from '@/components/waitress/tables-panel'
import { StaffPageHeader, StaffShell, type StaffSection } from '@/components/staff/staff-shell'

export function StaffDashboard() {
  const [activeSection, setActiveSection] = useState<StaffSection>('orders')

  return (
    <StaffShell activeSection={activeSection} onSectionChange={setActiveSection}>
      <div className="mx-auto max-w-6xl space-y-4">
        {activeSection === 'orders' ? (
          <>
            <StaffPageHeader
              title="Pedidos"
              description="Gestioná delivery, retiro y pedidos de mesa en tiempo real"
            />
            <CashierDashboard embedded />
          </>
        ) : (
          <>
            <StaffPageHeader
              title="Mesas"
              description="Estado del salón, toma de pedidos y cierre de cuentas"
            />
            <WaitressPanel embedded />
          </>
        )}
      </div>
    </StaffShell>
  )
}
