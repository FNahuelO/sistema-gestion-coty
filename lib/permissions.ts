export type Permission =
  | 'analytics:read'
  | 'admin:access'
  | 'tables:manage'
  | 'staff:manage'
  | 'settings:read'
  | 'settings:write'
  | 'schedules:manage'
  | 'staff:operate'
  | 'cashier:close'
  | 'cash:movement'

export type StaffRoleType = 'cashier' | 'waitress' | 'runner' | 'kitchen'

export type SessionRoleContext = {
  role: 'admin' | 'staff'
  staffRole?: StaffRoleType | null
}

const ADMIN_PERMISSIONS: Permission[] = [
  'analytics:read',
  'admin:access',
  'tables:manage',
  'staff:manage',
  'settings:read',
  'settings:write',
  'schedules:manage',
  'staff:operate',
  'cashier:close',
  'cash:movement',
]

const WAITRESS_PERMISSIONS: Permission[] = [
  'admin:access',
  'tables:manage',
  'settings:read',
  'staff:operate',
]

const CASHIER_PERMISSIONS: Permission[] = [
  ...WAITRESS_PERMISSIONS,
  'cashier:close',
  'cash:movement',
]

const RUNNER_PERMISSIONS: Permission[] = ['staff:operate']

const KITCHEN_PERMISSIONS: Permission[] = ['staff:operate']

export function mapStaffRole(value?: string | null): StaffRoleType | null {
  switch (value) {
    case 'CASHIER':
    case 'cashier':
      return 'cashier'
    case 'WAITRESS':
    case 'waitress':
      return 'waitress'
    case 'RUNNER':
    case 'runner':
      return 'runner'
    case 'KITCHEN':
    case 'kitchen':
      return 'kitchen'
    default:
      return null
  }
}

export function getPermissions(context: SessionRoleContext): Permission[] {
  if (context.role === 'admin') return ADMIN_PERMISSIONS
  if (context.staffRole === 'cashier') return CASHIER_PERMISSIONS
  if (context.staffRole === 'waitress') return WAITRESS_PERMISSIONS
  if (context.staffRole === 'kitchen') return KITCHEN_PERMISSIONS
  return RUNNER_PERMISSIONS
}

export function hasPermission(context: SessionRoleContext, permission: Permission): boolean {
  return getPermissions(context).includes(permission)
}

export function canAccessAdmin(context: SessionRoleContext): boolean {
  return hasPermission(context, 'admin:access')
}

export function getDefaultAdminSection(context: SessionRoleContext): 'dashboard' | 'tables' {
  return hasPermission(context, 'analytics:read') ? 'dashboard' : 'tables'
}

export const ADMIN_SECTION_PERMISSIONS: Record<string, Permission> = {
  dashboard: 'analytics:read',
  products: 'settings:write',
  categories: 'settings:write',
  promotions: 'settings:write',
  tables: 'tables:manage',
  users: 'staff:manage',
  schedules: 'schedules:manage',
  cash: 'cashier:close',
  commerce: 'settings:write',
  settings: 'settings:read',
}

export function canAccessCash(context: SessionRoleContext): boolean {
  return hasPermission(context, 'cashier:close') || hasPermission(context, 'cash:movement')
}

export function canAccessAdminSection(context: SessionRoleContext, section: string): boolean {
  if (section === 'cash') return canAccessCash(context)
  const permission = ADMIN_SECTION_PERMISSIONS[section]
  if (!permission) return false
  return hasPermission(context, permission)
}

export function getStaffRoleLabel(staffRole?: StaffRoleType | null, role?: 'admin' | 'staff'): string {
  if (role === 'admin') return 'Admin'
  if (staffRole === 'cashier') return 'Cajero/a'
  if (staffRole === 'waitress') return 'Mesera/o'
  if (staffRole === 'runner') return 'Cadete'
  if (staffRole === 'kitchen') return 'Cocina'
  return 'Personal'
}
