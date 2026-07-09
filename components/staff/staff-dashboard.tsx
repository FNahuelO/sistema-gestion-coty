'use client'

import { useMemo, useState } from 'react'
import { OrdersSection } from '@/components/staff/sections/orders-section'
import { TablesSection } from '@/components/staff/sections/tables-section'
import { KitchenSection } from '@/components/staff/sections/kitchen-section'
import { DeliverySection } from '@/components/staff/sections/delivery-section'
import { CallsSection } from '@/components/staff/sections/calls-section'
import { CashSection } from '@/components/admin/sections/cash-section'
import { StaffPageHeader, StaffShell, type StaffSection } from '@/components/staff/staff-shell'
import { useKitchenAlert } from '@/hooks/use-kitchen-alert'
import { useCallsAlert } from '@/hooks/use-calls-alert'
import { canAccessCash } from '@/lib/permissions'
import { useAuth } from '@/lib/store'

const SECTION_COPY: Record<StaffSection, { title: string; description: string }> = {
  orders: { title: 'Pedidos', description: 'Gestioná delivery, retiro y pedidos de mesa en tiempo real' },
  kitchen: { title: 'Cocina', description: 'Comandas pendientes y pantalla KDS' },
  tables: { title: 'Mesas', description: 'Estado del salón, toma de pedidos y cierre de cuentas' },
  delivery: { title: 'Cadetes', description: 'Asignación y seguimiento de entregas' },
  calls: { title: 'Llamados', description: 'Solicitudes de mesa desde el QR' },
  cash: { title: 'Caja', description: 'Apertura, movimientos y cierre de turno' },
}

// El cadete (runner) sólo opera sus entregas; cocina sólo ve la pantalla de
// cocina; cajera y admin ven caja; mesera y admin ven el panel operativo sin caja.
const RUNNER_SECTIONS: StaffSection[] = ['delivery']
const KITCHEN_SECTIONS: StaffSection[] = ['kitchen']
const BASE_STAFF_SECTIONS: StaffSection[] = ['orders', 'kitchen', 'tables', 'delivery', 'calls']

export function StaffDashboard() {
  const { user } = useAuth()
  const isRunner = user?.role !== 'admin' && user?.staffRole === 'runner'
  const isKitchen = user?.role !== 'admin' && user?.staffRole === 'kitchen'

  const roleContext = useMemo(
    () => ({
      role: user?.role === 'admin' ? 'admin' as const : 'staff' as const,
      staffRole: user?.staffRole ?? null,
    }),
    [user]
  )

  const allowedSections = useMemo(() => {
    if (isRunner) return RUNNER_SECTIONS
    if (isKitchen) return KITCHEN_SECTIONS
    if (canAccessCash(roleContext)) return [...BASE_STAFF_SECTIONS, 'cash']
    return BASE_STAFF_SECTIONS
  }, [isRunner, isKitchen, roleContext])

  const [activeSection, setActiveSection] = useState<StaffSection>(allowedSections[0])

  // Si por alguna razón la sección activa no está permitida para el rol, la corrige.
  const safeActiveSection = allowedSections.includes(activeSection)
    ? activeSection
    : allowedSections[0]

  const copy = SECTION_COPY[safeActiveSection]
  const { showKitchenAlert } = useKitchenAlert(safeActiveSection === 'kitchen')
  const { showCallsAlert } = useCallsAlert(safeActiveSection === 'calls')

  const runnerCopy = useMemo(
    () => ({ title: 'Mis entregas', description: 'Pedidos asignados a vos para retirar y entregar' }),
    []
  )
  const headerCopy = isRunner ? runnerCopy : copy

  const sectionAlerts = useMemo(() => {
    const alerts: Partial<Record<StaffSection, boolean>> = {}
    if (showKitchenAlert) alerts.kitchen = true
    if (showCallsAlert) alerts.calls = true
    return Object.keys(alerts).length > 0 ? alerts : undefined
  }, [showKitchenAlert, showCallsAlert])

  return (
    <StaffShell
      activeSection={safeActiveSection}
      onSectionChange={setActiveSection}
      sectionAlerts={sectionAlerts}
      sections={allowedSections}
    >
      <div className="mx-auto max-w-6xl space-y-4">
        <StaffPageHeader title={headerCopy.title} description={headerCopy.description} />
        {safeActiveSection === 'orders' ? (
          <OrdersSection embedded onNavigateToCalls={() => setActiveSection('calls')} />
        ) : null}
        {safeActiveSection === 'kitchen' ? <KitchenSection /> : null}
        {safeActiveSection === 'tables' ? <TablesSection embedded /> : null}
        {safeActiveSection === 'delivery' ? (
          <DeliverySection
            scopeToRunnerId={isRunner ? user?.id : undefined}
            canAssign={!isRunner}
          />
        ) : null}
        {safeActiveSection === 'calls' ? <CallsSection /> : null}
        {safeActiveSection === 'cash' ? <CashSection /> : null}
      </div>
    </StaffShell>
  )
}
