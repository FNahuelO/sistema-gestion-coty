import type { DeliveryAssignmentStatus } from '@/lib/types'

export const DELIVERY_ASSIGNMENT_LABELS: Record<DeliveryAssignmentStatus, string> = {
  unassigned: 'Sin asignar',
  assigned: 'Asignado',
  picked_up: 'En camino',
  delivered: 'Entregado',
}

export function formatDeliveryAssignmentStatus(status: DeliveryAssignmentStatus) {
  return DELIVERY_ASSIGNMENT_LABELS[status]
}
