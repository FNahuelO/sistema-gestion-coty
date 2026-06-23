'use client'

import { useState } from 'react'
import { OrdersSection } from '@/components/staff/sections/orders-section'
import { TablesSection } from '@/components/staff/sections/tables-section'
import { KitchenSection } from '@/components/staff/sections/kitchen-section'
import { DeliverySection } from '@/components/staff/sections/delivery-section'
import { CallsSection } from '@/components/staff/sections/calls-section'
import { CashSection } from '@/components/admin/sections/cash-section'
import { StaffPageHeader, StaffShell, type StaffSection } from '@/components/staff/staff-shell'
import { useKitchenAlert } from '@/hooks/use-kitchen-alert'

const SECTION_COPY: Record<StaffSection, { title: string; description: string }> = {
  orders: { title: 'Pedidos', description: 'Gestioná delivery, retiro y pedidos de mesa en tiempo real' },
  kitchen: { title: 'Cocina', description: 'Comandas pendientes y pantalla KDS' },
  tables: { title: 'Mesas', description: 'Estado del salón, toma de pedidos y cierre de cuentas' },
  delivery: { title: 'Cadetes', description: 'Asignación y seguimiento de entregas' },
  calls: { title: 'Llamados', description: 'Solicitudes de mesa desde el QR' },
  cash: { title: 'Caja', description: 'Apertura, movimientos y cierre de turno' },
}

export function StaffDashboard() {
  const [activeSection, setActiveSection] = useState<StaffSection>('orders')
  const copy = SECTION_COPY[activeSection]
  const { showKitchenAlert } = useKitchenAlert(activeSection === 'kitchen')

  return (
    <StaffShell
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      sectionAlerts={showKitchenAlert ? { kitchen: true } : undefined}
    >
      <div className="mx-auto max-w-6xl space-y-4">
        <StaffPageHeader title={copy.title} description={copy.description} />
        {activeSection === 'orders' ? (
          <OrdersSection embedded onNavigateToCalls={() => setActiveSection('calls')} />
        ) : null}
        {activeSection === 'kitchen' ? <KitchenSection /> : null}
        {activeSection === 'tables' ? <TablesSection embedded /> : null}
        {activeSection === 'delivery' ? <DeliverySection /> : null}
        {activeSection === 'calls' ? <CallsSection /> : null}
        {activeSection === 'cash' ? <CashSection /> : null}
      </div>
    </StaffShell>
  )
}
