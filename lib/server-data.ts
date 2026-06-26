import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { MercadoPagoConfig, Payment as MercadoPagoPayment, Preference } from 'mercadopago'
import {
  Prisma,
  OrderStatus as PrismaOrderStatus,
  OrderType as PrismaOrderType,
  PaymentMethod as PrismaPaymentMethod,
  PaymentStatus as PrismaPaymentStatus,
  TableStatus as PrismaTableStatus,
  UserRole as PrismaUserRole,
  StaffRole as PrismaStaffRole,
} from '@prisma/client'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getProductDiscountPercent } from '@/lib/promotions'
import type { AnalyticsOverview, BusinessSettings, CartItem, Category, ChannelSchedule, ChannelSetting, Order, PaymentMethod, Product, Promotion, SelectedOption, Table, User } from '@/lib/types'
import { getChannelAvailability, mapOrderTypeToChannel, mapPrismaChannel, mapToPrismaChannel } from '@/lib/channel-hours'
import { hasPermission, type Permission, type SessionRoleContext } from '@/lib/permissions'
import { buildWhatsAppOrderMessage } from '@/lib/whatsapp-message'
import { createTrackingProof, verifyTrackingProof } from '@/lib/tracking-proof'
import {
  buildMercadoPagoPreferenceItems,
  isMercadoPagoAvailable,
  resolveMercadoPagoCheckoutUrl,
  resolveMercadoPagoPayerEmail,
} from '@/lib/mercadopago-utils'
import {
  listDeliveryZones,
  upsertCustomerFromOrder,
  validateDiscountCode,
} from '@/lib/commerce'

export const selectedOptionSchema = z.object({
  optionId: z.string().min(1),
  choiceIds: z.array(z.string().min(1)).min(1),
})

export const cartItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  selectedOptions: z.array(selectedOptionSchema).default([]),
  notes: z.string().trim().max(500).optional(),
})

export const createOrderSchema = z
  .object({
    type: z.enum(['delivery', 'pickup', 'table']),
    paymentMethod: z.enum(['cash', 'card', 'transfer', 'mercado_pago']),
    customerName: z.string().trim().max(120).default(''),
    customerPhone: z.string().trim().max(40).default(''),
    customerAddress: z.string().trim().max(200).optional(),
    deliveryLat: z.number().min(-90).max(90).optional(),
    deliveryLng: z.number().min(-180).max(180).optional(),
    notes: z.string().trim().max(500).optional(),
    tableId: z.string().trim().optional(),
    deliveryZoneId: z.string().trim().optional(),
    discountCode: z.string().trim().max(32).optional(),
    tip: z.number().min(0).optional(),
    items: z.array(cartItemInputSchema).min(1),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'table') {
      if (!data.tableId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'TABLE_REQUIRED',
          path: ['tableId'],
        })
      }
      return
    }

    if (data.customerName.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El nombre debe tener al menos 2 caracteres',
        path: ['customerName'],
      })
    }

    if (data.customerPhone.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El teléfono debe tener al menos 3 caracteres',
        path: ['customerPhone'],
      })
    }
  })

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  icon: z.string().trim().min(1).max(40),
  order: z.number().int().min(0),
  active: z.boolean().default(true),
})

export const productChoiceInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(80),
  priceModifier: z.number().min(0),
})

export const productOptionInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(80),
  required: z.boolean().default(false),
  multiple: z.boolean().default(false),
  choices: z.array(productChoiceInputSchema).default([]),
})

export const productInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(500),
  price: z.number().min(0),
  image: z.string().trim().url(),
  categoryId: z.string().min(1),
  featured: z.boolean().default(false),
  available: z.boolean().default(true),
  preparationTime: z.number().int().min(0),
  trackStock: z.boolean().default(false),
  stock: z.number().int().min(0).optional().nullable(),
  lowStockThreshold: z.number().int().min(0).default(5),
  options: z.array(productOptionInputSchema).default([]),
})

export const promotionInputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(300),
  image: z.string().trim().url(),
  discount: z.number().min(0).max(100),
  validFrom: z.string(),
  validTo: z.string(),
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  active: z.boolean().default(true),
})

export const settingsInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  logo: z.string().trim().min(1),
  isOpen: z.boolean(),
  openTime: z.string().trim().min(1),
  closeTime: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  address: z.string().trim().min(1),
  instagram: z.string().trim().optional().or(z.literal('')),
  facebook: z.string().trim().optional().or(z.literal('')),
  whatsapp: z.string().trim().min(1),
  deliveryFee: z.number().min(0),
  minOrderAmount: z.number().min(0),
  taxRate: z.number().min(0).max(1),
  mercadoPagoEnabled: z.boolean().default(true),
})

export const tableInputSchema = z.object({
  number: z.number().int().positive(),
  capacity: z.number().int().positive(),
  status: z.enum(['free', 'occupied', 'waiting', 'finished']).default('free'),
  active: z.boolean().default(true),
})

export const userInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  role: z.enum(['admin', 'staff']),
  staffRole: z.enum(['cashier', 'runner']).optional().nullable(),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  pin: z.string().regex(/^\d{4,6}$/).optional().or(z.literal('')),
  avatar: z.string().trim().url().optional().or(z.literal('')),
  active: z.boolean().default(true),
  password: z.string().min(6).max(120).optional(),
})

const orderInclude = {
  items: {
    include: {
      selections: true,
      product: true,
    },
  },
  payment: true,
  diningTable: true,
  createdByUser: true,
} satisfies Prisma.OrderInclude

const productInclude = {
  options: {
    include: {
      choices: true,
    },
    orderBy: {
      sortOrder: 'asc',
    },
  },
  images: {
    orderBy: {
      sortOrder: 'asc',
    },
  },
} satisfies Prisma.ProductInclude

const promotionInclude = {
  products: true,
  categories: true,
} satisfies Prisma.PromotionInclude

const tableInclude = {
  sessions: {
    where: {
      closedAt: null,
    },
    orderBy: {
      openedAt: 'desc',
    },
    take: 1,
    include: {
      orders: {
        orderBy: {
          createdAt: 'desc',
        },
        include: orderInclude,
      },
    },
  },
} satisfies Prisma.DiningTableInclude

export type SessionUser = User & {
  role: 'admin' | 'staff'
  staffRole?: User['staffRole']
}

function toSessionContext(user: SessionUser): SessionRoleContext {
  return {
    role: user.role,
    staffRole: user.staffRole ?? null,
  }
}

function decimalToNumber(value: Prisma.Decimal | number | string | null | undefined) {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  return Number(value.toString())
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function mapUserRole(role: string): User['role'] {
  switch (role) {
    case 'ADMIN':
    case 'admin':
      return 'admin'
    case 'STAFF':
    case 'staff':
    case 'CASHIER':
    case 'cashier':
    case 'WAITRESS':
    case 'waitress':
      return 'staff'
    default:
      return 'staff'
  }
}

function toPrismaUserRole(role: User['role']): PrismaUserRole {
  switch (role) {
    case 'admin':
      return PrismaUserRole.ADMIN
    default:
      return PrismaUserRole.STAFF
  }
}

function toPrismaStaffRole(staffRole?: User['staffRole'] | null): PrismaStaffRole | null {
  if (!staffRole) return null
  return staffRole === 'cashier' ? PrismaStaffRole.CASHIER : PrismaStaffRole.RUNNER
}

function mapPrismaStaffRole(value?: string | null): User['staffRole'] | undefined {
  switch (value) {
    case 'CASHIER':
      return 'cashier'
    case 'RUNNER':
      return 'runner'
    default:
      return undefined
  }
}

function mapOrderType(type: PrismaOrderType | string): Order['type'] {
  switch (type) {
    case 'DELIVERY':
    case 'delivery':
      return 'delivery'
    case 'PICKUP':
    case 'pickup':
      return 'pickup'
    default:
      return 'table'
  }
}

function mapOrderStatus(status: PrismaOrderStatus | string): Order['status'] {
  switch (status) {
    case 'PENDING':
    case 'pending':
      return 'pending'
    case 'CONFIRMED':
    case 'confirmed':
      return 'confirmed'
    case 'PREPARING':
    case 'preparing':
      return 'preparing'
    case 'READY':
    case 'ready':
      return 'ready'
    case 'DELIVERED':
    case 'delivered':
      return 'delivered'
    case 'COMPLETED':
    case 'completed':
      return 'completed'
    default:
      return 'cancelled'
  }
}

function mapPaymentMethod(method: PrismaPaymentMethod | string): PaymentMethod {
  switch (method) {
    case 'CARD':
    case 'card':
      return 'card'
    case 'TRANSFER':
    case 'transfer':
      return 'transfer'
    case 'MERCADO_PAGO':
    case 'mercado_pago':
      return 'mercado_pago'
    default:
      return 'cash'
  }
}

function mapPaymentStatus(status: PrismaPaymentStatus | string | null | undefined): Order['paymentStatus'] {
  switch (status) {
    case 'APPROVED':
    case 'approved':
      return 'approved'
    case 'REQUIRES_ACTION':
    case 'requires_action':
      return 'requires_action'
    case 'REJECTED':
    case 'rejected':
      return 'rejected'
    case 'CANCELLED':
    case 'cancelled':
      return 'cancelled'
    case 'REFUNDED':
    case 'refunded':
      return 'refunded'
    default:
      return 'pending'
  }
}

function mapTableStatus(status: PrismaTableStatus | string): Table['status'] {
  switch (status) {
    case 'OCCUPIED':
    case 'occupied':
      return 'occupied'
    case 'WAITING':
    case 'waiting':
      return 'waiting'
    case 'FINISHED':
    case 'finished':
      return 'finished'
    default:
      return 'free'
  }
}

export async function getSessionUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return null
  }

  return {
    id: session.user.id,
    name: session.user.name ?? '',
    email: session.user.email ?? '',
    role: session.user.role,
    staffRole: session.user.staffRole ?? undefined,
    avatar: session.user.avatar ?? undefined,
  } satisfies SessionUser
}

export async function requireSessionUser() {
  const user = await getSessionUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

export async function requireSessionRole(roles: Array<User['role']>) {
  const user = await requireSessionUser()
  if (!roles.includes(user.role)) {
    throw new Error('FORBIDDEN')
  }
  return user
}

export async function requirePermission(permission: Permission) {
  const user = await requireSessionUser()
  if (!hasPermission(toSessionContext(user), permission)) {
    throw new Error('FORBIDDEN')
  }
  return user
}

export function serializeCategory(category: Prisma.CategoryUncheckedCreateInput & { id: string; name: string; icon: string; sortOrder: number; active?: boolean }) {
  return {
    id: category.id,
    slug: 'slug' in category ? category.slug : undefined,
    name: category.name,
    icon: category.icon,
    order: category.sortOrder,
    active: category.active ?? true,
  } satisfies Category
}

export function serializeProduct(product: Prisma.ProductGetPayload<{ include: typeof productInclude }>): Product {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: decimalToNumber(product.basePrice),
    image: product.images[0]?.url ?? product.imageUrl,
    categoryId: product.categoryId,
    featured: product.featured,
    available: product.available,
    preparationTime: product.preparationTime,
    trackStock: product.trackStock,
    stock: product.stock ?? undefined,
    lowStockThreshold: product.lowStockThreshold,
    options: product.options.map((option) => ({
      id: option.id,
      name: option.name,
      required: option.required,
      multiple: option.multiple,
      choices: option.choices.map((choice) => ({
        id: choice.id,
        name: choice.name,
        priceModifier: decimalToNumber(choice.priceModifier),
      })),
    })),
  }
}

export function serializePromotion(promotion: Prisma.PromotionGetPayload<{ include: typeof promotionInclude }>): Promotion {
  return {
    id: promotion.id,
    title: promotion.title,
    description: promotion.description,
    image: promotion.imageUrl,
    discount: decimalToNumber(promotion.discount),
    validFrom: promotion.validFrom,
    validTo: promotion.validTo,
    productIds: promotion.products.map((item) => item.productId),
    categoryIds: promotion.categories.map((item) => item.categoryId),
    active: promotion.active,
  }
}

export function serializeSettings(settings: Prisma.BusinessSettingsGetPayload<object>): BusinessSettings {
  return {
    id: settings.id,
    name: settings.name,
    logo: settings.logo,
    isOpen: settings.isOpen,
    openTime: settings.openTime,
    closeTime: settings.closeTime,
    timezone: settings.timezone ?? 'America/Argentina/Buenos_Aires',
    phone: settings.phone,
    address: settings.address,
    instagram: settings.instagram ?? undefined,
    facebook: settings.facebook ?? undefined,
    whatsapp: settings.whatsapp,
    deliveryFee: decimalToNumber(settings.deliveryFee),
    minOrderAmount: decimalToNumber(settings.minOrderAmount),
    taxRate: decimalToNumber(settings.taxRate),
    mercadoPagoEnabled: settings.mercadoPagoEnabled,
  }
}

export function serializeUser(user: {
  id: string
  name: string
  email: string
  role: PrismaUserRole | User['role']
  staffRole?: string | null
  phone?: string | null
  avatarUrl: string | null
  active: boolean
}): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapUserRole(user.role),
    staffRole: mapPrismaStaffRole(user.staffRole),
    phone: user.phone ?? undefined,
    avatar: user.avatarUrl ?? undefined,
    active: user.active,
  }
}

export function serializeOrder(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>): Order {
  return {
    id: order.id,
    displayCode: order.displayCode ?? undefined,
    publicTrackingCode: order.publicTrackingCode ?? undefined,
    type: mapOrderType(order.type),
    status: mapOrderStatus(order.status),
    paymentMethod: mapPaymentMethod(order.paymentMethod),
    paymentStatus: mapPaymentStatus(order.payment?.status),
    paymentUrl: resolveMercadoPagoCheckoutUrl(order.payment?.initPoint, order.payment?.sandboxInitPoint),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress ?? undefined,
    notes: order.notes ?? undefined,
    subtotal: decimalToNumber(order.subtotal),
    tax: decimalToNumber(order.tax),
    deliveryFee: decimalToNumber(order.deliveryFee),
    tip: decimalToNumber(order.tip ?? 0),
    discountCode: order.discountCode ?? undefined,
    discountAmount: decimalToNumber(order.discountAmount ?? 0),
    total: decimalToNumber(order.total),
    tableId: order.diningTableId ?? undefined,
    tableNumber: order.diningTable?.number ?? undefined,
    tableSessionId: order.tableSessionId ?? undefined,
    createdByUserId: order.createdByUserId ?? undefined,
    items: order.items.map(
      (item): CartItem => ({
        id: item.id,
        product: {
          id: item.productId ?? item.id,
          name: item.productName,
          description: item.productDescription ?? '',
          price: decimalToNumber(item.basePrice),
          image: item.imageUrl ?? '',
          categoryId: '',
          featured: false,
          available: true,
          preparationTime: item.product?.preparationTime ?? 0,
        },
        quantity: item.quantity,
        notes: item.notes ?? undefined,
        selectedOptions: item.selections.reduce<SelectedOption[]>((accumulator, selection) => {
          const existing = accumulator.find((candidate) => candidate.optionId === selection.optionName)
          if (existing) {
            existing.choiceIds.push(selection.choiceName)
          } else {
            accumulator.push({ optionId: selection.optionName, choiceIds: [selection.choiceName] })
          }
          return accumulator
        }, []),
      })
    ),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

/** Oculta PII y campos internos en respuestas públicas o de cliente. */
export function stripOrderPii(order: Order): Order {
  const isTable = order.type === 'table'

  return {
    ...order,
    customerName: isTable
      ? order.tableNumber
        ? `Mesa ${order.tableNumber}`
        : order.customerName
      : order.customerName.split('·')[0]?.trim() || 'Cliente',
    customerPhone: '',
    customerAddress: undefined,
    paymentUrl: undefined,
    createdByUserId: undefined,
    tableId: undefined,
    tableNumber: isTable ? order.tableNumber : undefined,
    tableSessionId: undefined,
  }
}

/** Respuesta segura al crear pedido desde el cliente (sin PII + prueba HMAC para MP). */
export function buildCustomerOrderResponse(order: Order): Order & { trackingProof: string } {
  const trackingCode = order.publicTrackingCode ?? order.id

  return {
    ...stripOrderPii(order),
    paymentUrl: order.paymentUrl,
    trackingProof: createTrackingProof(order.id, trackingCode),
  }
}

/** Respuesta mínima tras crear preferencia MP (sin PII). */
export function buildPaymentPreferenceResponse(order: Order) {
  return {
    id: order.id,
    displayCode: order.displayCode,
    publicTrackingCode: order.publicTrackingCode,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentUrl: order.paymentUrl,
  }
}

/** Versión pública para seguimiento de pedido: sin PII ni URLs de pago. */
export function serializePublicTrackedOrder(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>): Order {
  return stripOrderPii(serializeOrder(order))
}

export function serializeTable(table: Prisma.DiningTableGetPayload<{ include: typeof tableInclude }>): Table {
  const activeSession = table.sessions[0]
  const latestOrder = activeSession?.orders[0]
  const currentTotal = activeSession
    ? activeSession.orders
        .filter((order) => order.status !== 'CANCELLED')
        .reduce((sum, order) => sum + decimalToNumber(order.total), 0)
    : 0

  return {
    id: table.id,
    number: table.number,
    capacity: table.capacity,
    status: mapTableStatus(table.status),
    active: table.active,
    currentOrderId: latestOrder?.id,
    waitressId: activeSession?.waitressId ?? undefined,
    currentTotal,
    currentSessionId: activeSession?.id,
  }
}

export async function getPublicTable(tableId: string) {
  const table = await prisma.diningTable.findFirst({
    where: {
      id: tableId,
      active: true,
      deletedAt: null,
    },
    select: {
      id: true,
      number: true,
    },
  })

  if (!table) return null

  return {
    id: table.id,
    number: table.number,
  }
}

export async function getPublicCatalog() {
  const [settings, categories, products, promotions, channelSettings, schedules, deliveryZones] = await Promise.all([
    prisma.businessSettings.findUnique({ where: { id: 'main' } }),
    prisma.category.findMany({
      where: { deletedAt: null, active: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.product.findMany({
      where: { deletedAt: null, available: true },
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      include: productInclude,
    }),
    prisma.promotion.findMany({
      where: {
        deletedAt: null,
        active: true,
      },
      orderBy: { validFrom: 'desc' },
      include: promotionInclude,
    }),
    prisma.channelSettings.findMany(),
    prisma.channelSchedule.findMany({ orderBy: [{ channel: 'asc' }, { sortOrder: 'asc' }] }),
    listDeliveryZones(),
  ])

  const serializedSettings = settings ? serializeSettings(settings) : null
  const serializedSchedules = schedules.map((entry) => ({
    id: entry.id,
    channel: mapPrismaChannel(entry.channel),
    label: entry.label,
    startTime: entry.startTime,
    endTime: entry.endTime,
    daysOfWeek: entry.daysOfWeek,
    active: entry.active,
    sortOrder: entry.sortOrder,
  }))
  const serializedChannelSettings = channelSettings.map((entry) => ({
    channel: mapPrismaChannel(entry.channel),
    enabled: entry.enabled,
  }))

  const channelAvailability = serializedSettings
    ? {
        delivery: getChannelAvailability(
          'delivery',
          new Date(),
          serializedSettings,
          serializedChannelSettings,
          serializedSchedules
        ),
        local: getChannelAvailability('local', new Date(), serializedSettings, serializedChannelSettings, serializedSchedules),
        pickup: getChannelAvailability('pickup', new Date(), serializedSettings, serializedChannelSettings, serializedSchedules),
      }
    : null

  return {
    settings: serializedSettings,
    categories: categories.map((category) => serializeCategory(category)),
    products: products.map(serializeProduct),
    promotions: promotions.map(serializePromotion),
    channelSettings: serializedChannelSettings,
    schedules: serializedSchedules,
    channelAvailability,
    deliveryZones: deliveryZones
      .filter((zone) => zone.active)
      .map((zone) => {
        const hasGeo =
          zone.geoType === 'RADIUS'
            ? zone.centerLat != null && zone.centerLng != null && zone.radiusKm != null
            : Array.isArray(zone.polygon) && (zone.polygon as unknown[]).length >= 3
        return {
          id: zone.id,
          name: zone.name,
          deliveryFee: decimalToNumber(zone.deliveryFee),
          minOrderAmount: decimalToNumber(zone.minOrderAmount),
          geoType: zone.geoType as 'RADIUS' | 'POLYGON',
          hasGeo,
        }
      }),
    mercadoPagoAvailable: isMercadoPagoAvailable(settings),
  }
}

export async function getOperationalOrders() {
  const orders = await prisma.order.findMany({
    where: {
      deletedFromOperationsAt: null,
    },
    orderBy: { createdAt: 'desc' },
    include: orderInclude,
  })

  return orders.map(serializeOrder)
}

export async function getTablesSnapshot(options?: { includeDeleted?: boolean; activeOnly?: boolean }) {
  const where: {
    deletedAt?: null | { not: null }
    active?: boolean
  } = {}

  if (options?.includeDeleted) {
    where.deletedAt = { not: null }
  } else {
    where.deletedAt = null
  }

  if (options?.activeOnly) {
    where.active = true
  }

  const tables = await prisma.diningTable.findMany({
    where,
    orderBy: { number: 'asc' },
    include: tableInclude,
  })

  return tables.map(serializeTable)
}

async function ensureOpenTableSession(tableId: string, waitressId?: string) {
  const activeSession = await prisma.tableSession.findFirst({
    where: {
      tableId,
      closedAt: null,
    },
    orderBy: {
      openedAt: 'desc',
    },
  })

  if (activeSession) {
    if (waitressId && activeSession.waitressId !== waitressId) {
      return prisma.tableSession.update({
        where: { id: activeSession.id },
        data: { waitressId },
      })
    }
    return activeSession
  }

  return prisma.tableSession.create({
    data: {
      tableId,
      waitressId,
      accumulatedTotal: 0,
    },
  })
}

function buildDisplayCode() {
  return `ORD-${Date.now().toString(36).toUpperCase()}`
}

function buildTrackingCode() {
  return `TRK-${randomUUID().slice(0, 8).toUpperCase()}`
}

async function applyStockDeltaForOrderItems(
  tx: Prisma.TransactionClient,
  items: Array<{ productId: string | null; quantity: number }>,
  direction: 'decrement' | 'increment'
) {
  const quantities = new Map<string, number>()

  for (const item of items) {
    if (!item.productId) continue
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity)
  }

  for (const [productId, requested] of quantities) {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { trackStock: true, stock: true },
    })

    if (!product?.trackStock || product.stock === null) continue

    if (direction === 'decrement') {
      const updated = await tx.product.updateMany({
        where: { id: productId, stock: { gte: requested } },
        data: { stock: { decrement: requested } },
      })
      if (updated.count === 0) {
        throw new Error('OUT_OF_STOCK')
      }
    } else {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: requested } },
      })
    }
  }
}

export async function createOrderFromPayload(payload: z.input<typeof createOrderSchema>, createdByUserId?: string) {
  const input = createOrderSchema.parse(payload)
  const settings = await prisma.businessSettings.findUnique({ where: { id: 'main' } })

  if (!settings) {
    throw new Error('SETTINGS_NOT_FOUND')
  }

  if (!settings.isOpen && input.type !== 'table') {
    throw new Error('BUSINESS_CLOSED')
  }

  if (input.paymentMethod === 'mercado_pago' && !isMercadoPagoAvailable(settings)) {
    throw new Error('MERCADOPAGO_UNAVAILABLE')
  }

  if (input.type !== 'table') {
    const availability = await getOrderChannelAvailability(input.type, settings)
    if (!availability.open) {
      throw new Error('CHANNEL_CLOSED')
    }
  }

  const productIds = [...new Set(input.items.map((item) => item.productId))]
  const [products, activePromotions] = await Promise.all([
    prisma.product.findMany({
      where: {
        id: { in: productIds },
        deletedAt: null,
        available: true,
      },
      include: productInclude,
    }),
    prisma.promotion.findMany({
      where: {
        active: true,
        validFrom: { lte: new Date() },
        validTo: { gte: new Date() },
      },
      include: promotionInclude,
    }),
  ])

  if (products.length !== productIds.length) {
    throw new Error('INVALID_PRODUCTS')
  }

  for (const product of products) {
    if (product.trackStock && product.stock !== null) {
      const requested = input.items.filter((i) => i.productId === product.id).reduce((s, i) => s + i.quantity, 0)
      if (product.stock < requested) throw new Error('OUT_OF_STOCK')
    }
  }

  const serializedPromotions = activePromotions.map(serializePromotion)

  let diningTable:
    | {
        id: string
        number: number
      }
    | undefined
  let tableSessionId: string | undefined

  if (input.type === 'table') {
    if (!input.tableId) {
      throw new Error('TABLE_REQUIRED')
    }

    const table = await prisma.diningTable.findUnique({
      where: { id: input.tableId },
      select: { id: true, number: true, active: true, deletedAt: true },
    })

    if (!table) {
      throw new Error('TABLE_NOT_FOUND')
    }

    if (!table.active || table.deletedAt) {
      throw new Error('TABLE_UNAVAILABLE')
    }

    diningTable = table
    const session = await ensureOpenTableSession(table.id, createdByUserId)
    tableSessionId = session.id
  }

  const itemsToCreate = input.items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId)
    if (!product) {
      throw new Error('INVALID_PRODUCT')
    }

    let unitPrice = decimalToNumber(product.basePrice)

    const normalizedSelections = item.selectedOptions.flatMap((selectedOption) => {
      const option = product.options.find((candidate) => candidate.id === selectedOption.optionId || candidate.name === selectedOption.optionId)
      if (!option) {
        throw new Error('INVALID_OPTION')
      }

      if (option.required && selectedOption.choiceIds.length === 0) {
        throw new Error('REQUIRED_OPTION')
      }

      if (!option.multiple && selectedOption.choiceIds.length > 1) {
        throw new Error('INVALID_OPTION_SELECTION')
      }

      return selectedOption.choiceIds.map((choiceId) => {
        const choice =
          option.choices.find((candidate) => candidate.id === choiceId) ??
          option.choices.find((candidate) => candidate.name === choiceId)

        if (!choice) {
          throw new Error('INVALID_CHOICE')
        }

        unitPrice += decimalToNumber(choice.priceModifier)

        return {
          optionName: option.name,
          choiceName: choice.name,
          priceModifier: decimalToNumber(choice.priceModifier),
        }
      })
    })

    const serializedProduct = serializeProduct(product)
    const discountPercent = getProductDiscountPercent(serializedProduct, serializedPromotions)
    const discountedUnitPrice = discountPercent > 0 ? unitPrice * (1 - discountPercent / 100) : unitPrice

    return {
      productId: product.id,
      productName: product.name,
      productDescription: product.description,
      basePrice: decimalToNumber(product.basePrice),
      unitPrice: discountedUnitPrice,
      imageUrl: product.images[0]?.url ?? product.imageUrl,
      quantity: item.quantity,
      notes: item.notes,
      selections: normalizedSelections,
    }
  })

  const subtotal = itemsToCreate.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  let deliveryFee = input.type === 'delivery' ? decimalToNumber(settings.deliveryFee) : 0
  let deliveryZoneId: string | undefined

  if (input.type === 'delivery' && input.deliveryZoneId) {
    const zone = await prisma.deliveryZone.findFirst({
      where: { id: input.deliveryZoneId, active: true },
    })
    if (zone) {
      deliveryFee = decimalToNumber(zone.deliveryFee)
      deliveryZoneId = zone.id
      const zoneMin = decimalToNumber(zone.minOrderAmount)
      if (zoneMin > 0 && subtotal < zoneMin) throw new Error('MIN_ORDER_AMOUNT')
    }
  }

  let discountAmount = 0
  let discountCode: string | undefined
  if (input.discountCode) {
    const discount = await validateDiscountCode(input.discountCode, subtotal, input.paymentMethod)
    discountAmount = discount.amount
    discountCode = discount.code
  }

  if (input.type !== 'table') {
    const minAmount = decimalToNumber(settings.minOrderAmount)
    if (minAmount > 0 && subtotal - discountAmount < minAmount) {
      throw new Error('MIN_ORDER_AMOUNT')
    }
  }

  const tip = input.tip ?? 0
  const tax = (subtotal - discountAmount) * decimalToNumber(settings.taxRate)
  const total = Math.max(0, subtotal - discountAmount) + tax + deliveryFee + tip

  const customer =
    input.type !== 'table'
      ? await upsertCustomerFromOrder(input.customerPhone, input.customerName, input.customerAddress)
      : null

  const orderData = {
    displayCode: buildDisplayCode(),
    publicTrackingCode: buildTrackingCode(),
    type:
      input.type === 'delivery'
        ? 'DELIVERY'
        : input.type === 'pickup'
          ? 'PICKUP'
          : 'TABLE',
    status: input.paymentMethod === 'mercado_pago' ? 'PENDING' : 'CONFIRMED',
    paymentMethod:
      input.paymentMethod === 'card'
        ? 'CARD'
        : input.paymentMethod === 'transfer'
          ? 'TRANSFER'
          : input.paymentMethod === 'mercado_pago'
            ? 'MERCADO_PAGO'
            : 'CASH',
    customerName:
      input.type === 'table' && diningTable
        ? `Mesa ${diningTable.number}`
        : input.customerName,
    customerPhone: input.type === 'table' ? input.customerPhone || 'mesa' : input.customerPhone,
    customerAddress: input.type === 'delivery' ? input.customerAddress : undefined,
    deliveryLat: input.type === 'delivery' ? input.deliveryLat : undefined,
    deliveryLng: input.type === 'delivery' ? input.deliveryLng : undefined,
    notes: input.notes,
    subtotal,
    tax,
    deliveryFee,
    tip,
    discountCode,
    discountAmount,
    deliveryZoneId,
    customerId: customer?.id,
    total,
    diningTableId: diningTable?.id,
    tableSessionId,
    createdByUserId,
    items: {
      create: itemsToCreate.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productDescription: item.productDescription,
        basePrice: item.basePrice,
        unitPrice: item.unitPrice,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        notes: item.notes,
        selections: {
          create: item.selections,
        },
      })),
    },
    payment: {
      create: {
        provider: input.paymentMethod === 'mercado_pago' ? 'mercadopago' : 'manual',
        method:
          input.paymentMethod === 'card'
            ? 'CARD'
            : input.paymentMethod === 'transfer'
              ? 'TRANSFER'
              : input.paymentMethod === 'mercado_pago'
                ? 'MERCADO_PAGO'
                : 'CASH',
        status: 'PENDING',
        amount: total,
      },
    },
    statusHistory: {
      create: {
        status: input.paymentMethod === 'mercado_pago' ? 'PENDING' : 'CONFIRMED',
        changedByUserId: createdByUserId,
        note: input.paymentMethod === 'mercado_pago' ? 'Pedido creado, pendiente de pago online' : 'Pedido creado',
      },
    },
  } 

  const deferStockDecrement = input.paymentMethod === 'mercado_pago'

  const createdOrder = await prisma.$transaction(async (tx) => {
    if (!deferStockDecrement) {
      await applyStockDeltaForOrderItems(tx, itemsToCreate.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })), 'decrement')
    }

    const order = await tx.order.create({
      data: orderData,
      include: orderInclude,
    })

    if (diningTable?.id && tableSessionId) {
      await tx.diningTable.update({
        where: { id: diningTable.id },
        data: { status: 'WAITING' },
      })
      await tx.tableSession.update({
        where: { id: tableSessionId },
        data: {
          accumulatedTotal: { increment: total },
        },
      })
    }

    return order
  })

  const serialized = serializeOrder(createdOrder)

  const whatsappMessage = buildWhatsAppOrderMessage(serialized, settings.name)
  await prisma.order.update({
    where: { id: createdOrder.id },
    data: {
      whatsappMessage,
    },
  })

  return {
    ...serialized,
    notes: input.notes,
    paymentUrl: resolveMercadoPagoCheckoutUrl(
      createdOrder.payment?.initPoint,
      createdOrder.payment?.sandboxInitPoint
    ),
  }
}

function getMercadoPagoConfig() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error('MERCADOPAGO_NOT_CONFIGURED')
  }

  return new MercadoPagoConfig({
    accessToken,
  })
}

export async function createPreferenceForOrder(orderId: string, baseUrl: string, trackingProof: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  })

  if (!order) {
    throw new Error('ORDER_NOT_FOUND')
  }

  const publicTrackingCode = order.publicTrackingCode
  if (!publicTrackingCode || !verifyTrackingProof(orderId, publicTrackingCode, trackingProof)) {
    throw new Error('INVALID_TRACKING_PROOF')
  }

  if (order.paymentMethod !== 'MERCADO_PAGO') {
    throw new Error('INVALID_PAYMENT_METHOD')
  }

  if (order.status !== 'PENDING') {
    throw new Error('ORDER_NOT_PAYABLE')
  }

  const settings = await prisma.businessSettings.findUnique({
    where: { id: 'main' },
  })

  if (!settings) {
    throw new Error('SETTINGS_NOT_FOUND')
  }

  const { items: preferenceItems, couponAmount } = buildMercadoPagoPreferenceItems(order)

  const preferenceClient = new Preference(getMercadoPagoConfig())
  const response = await preferenceClient.create({
    body: {
      external_reference: order.id,
      notification_url: `${baseUrl}/api/payments/mercadopago/webhook`,
      statement_descriptor: settings.name.slice(0, 13),
      auto_return: 'approved',
      back_urls: {
        success: `${baseUrl}/mp/return?orderId=${order.id}`,
        pending: `${baseUrl}/mp/return?orderId=${order.id}`,
        failure: `${baseUrl}/mp/return?orderId=${order.id}`,
      },
      payer: {
        name: order.customerName,
        email: resolveMercadoPagoPayerEmail(order.customerName, order.customerPhone),
        phone: {
          number: order.customerPhone,
        },
      },
      items: preferenceItems,
      ...(couponAmount ? { coupon_amount: couponAmount } : {}),
    },
  })

  await prisma.payment.update({
    where: { orderId: order.id },
    data: {
      provider: 'mercadopago',
      providerPreferenceId: response.id,
      externalReference: order.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point,
      status: 'REQUIRES_ACTION',
    },
  })

  const updated = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  })

  return updated
    ? buildPaymentPreferenceResponse({
        ...serializeOrder(updated),
        paymentUrl: resolveMercadoPagoCheckoutUrl(
          updated.payment?.initPoint,
          updated.payment?.sandboxInitPoint
        ),
      })
    : null
}

export async function syncMercadoPagoPayment(paymentId: string | number, payload?: unknown) {
  const paymentClient = new MercadoPagoPayment(getMercadoPagoConfig())
  const paymentResponse = await paymentClient.get({ id: paymentId })

  const externalReference = paymentResponse.external_reference
  if (!externalReference) {
    throw new Error('PAYMENT_WITHOUT_REFERENCE')
  }

  const paymentStatus =
    paymentResponse.status === 'approved'
      ? PrismaPaymentStatus.APPROVED
      : paymentResponse.status === 'rejected'
        ? PrismaPaymentStatus.REJECTED
        : paymentResponse.status === 'cancelled'
          ? PrismaPaymentStatus.CANCELLED
          : PrismaPaymentStatus.PENDING

  const orderStatus =
    paymentStatus === PrismaPaymentStatus.APPROVED
      ? PrismaOrderStatus.CONFIRMED
      : paymentStatus === PrismaPaymentStatus.REJECTED || paymentStatus === PrismaPaymentStatus.CANCELLED
        ? PrismaOrderStatus.CANCELLED
        : PrismaOrderStatus.PENDING

  await prisma.$transaction(async (tx) => {
    const existingOrder = await tx.order.findUnique({
      where: { id: externalReference },
      include: { items: true },
    })

    if (!existingOrder) {
      throw new Error('ORDER_NOT_FOUND')
    }

    const previousStatus = existingOrder.status

    await tx.payment.updateMany({
      where: {
        OR: [{ orderId: externalReference }, { providerPaymentId: String(paymentResponse.id) }],
      },
      data: {
        providerPaymentId: String(paymentResponse.id),
        status: paymentStatus,
        rawPayload: payload ? (payload as Prisma.InputJsonValue) : (paymentResponse as Prisma.InputJsonValue),
      },
    })

    await tx.order.update({
      where: { id: externalReference },
      data: {
        status: orderStatus,
        statusHistory: {
          create: {
            status: orderStatus,
            note: `Webhook Mercado Pago: ${paymentResponse.status ?? 'pending'}`,
          },
        },
      },
    })

    if (
      paymentStatus === PrismaPaymentStatus.APPROVED &&
      previousStatus === PrismaOrderStatus.PENDING &&
      existingOrder.paymentMethod === PrismaPaymentMethod.MERCADO_PAGO
    ) {
      await applyStockDeltaForOrderItems(tx, existingOrder.items, 'decrement')
    }
  })
}

export async function updateOrderStatus(orderId: string, status: Order['status'], userId?: string, note?: string) {
  const prismaStatus =
    status === 'pending'
      ? PrismaOrderStatus.PENDING
      : status === 'confirmed'
        ? PrismaOrderStatus.CONFIRMED
        : status === 'preparing'
          ? PrismaOrderStatus.PREPARING
          : status === 'ready'
            ? PrismaOrderStatus.READY
            : status === 'delivered'
              ? PrismaOrderStatus.DELIVERED
              : status === 'completed'
                ? PrismaOrderStatus.COMPLETED
                : PrismaOrderStatus.CANCELLED

  const shouldApproveManualPayment = status === 'delivered' || status === 'completed'

  const order = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: prismaStatus,
        statusHistory: {
          create: {
            status: prismaStatus,
            changedByUserId: userId,
            note,
          },
        },
      },
      include: orderInclude,
    })

    if (shouldApproveManualPayment) {
      await tx.payment.updateMany({
        where: {
          orderId,
          status: 'PENDING',
          method: { in: ['CASH', 'CARD', 'TRANSFER'] },
        },
        data: { status: 'APPROVED' },
      })
    }

    return updated
  })

  if (shouldApproveManualPayment) {
    const withPayment = await prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    })
    return serializeOrder(withPayment ?? order)
  }

  return serializeOrder(order)
}

export async function occupyTable(tableId: string, userId?: string) {
  await ensureOpenTableSession(tableId, userId)

  const updated = await prisma.diningTable.update({
    where: { id: tableId },
    data: { status: PrismaTableStatus.OCCUPIED },
    include: tableInclude,
  })

  return serializeTable(updated)
}

export async function closeTableAndOrders(
  tableId: string,
  userId?: string,
  paymentMethod: 'cash' | 'card' | 'transfer' = 'cash'
) {
  const session = await prisma.tableSession.findFirst({
    where: {
      tableId,
      closedAt: null,
    },
    orderBy: {
      openedAt: 'desc',
    },
    include: {
      orders: true,
    },
  })

  if (!session) {
    throw new Error('TABLE_SESSION_NOT_FOUND')
  }

  const prismaPaymentMethod =
    paymentMethod === 'card' ? 'CARD' : paymentMethod === 'transfer' ? 'TRANSFER' : 'CASH'
  const orderIds = session.orders.map((order) => order.id)

  await prisma.$transaction([
    ...(orderIds.length > 0
      ? [
          prisma.payment.updateMany({
            where: { orderId: { in: orderIds } },
            data: {
              method: prismaPaymentMethod,
              status: 'APPROVED',
            },
          }),
          prisma.order.updateMany({
            where: { id: { in: orderIds } },
            data: {
              paymentMethod: prismaPaymentMethod,
            },
          }),
        ]
      : []),
    prisma.order.updateMany({
      where: {
        tableSessionId: session.id,
        status: {
          notIn: [PrismaOrderStatus.COMPLETED, PrismaOrderStatus.CANCELLED],
        },
      },
      data: {
        status: PrismaOrderStatus.COMPLETED,
      },
    }),
    prisma.tableSession.update({
      where: { id: session.id },
      data: {
        closedAt: new Date(),
      },
    }),
    prisma.diningTable.update({
      where: { id: tableId },
      data: {
        status: PrismaTableStatus.FREE,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'table.closed',
        entityType: 'table',
        entityId: tableId,
        createdByUserId: userId,
        metadata: {
          tableSessionId: session.id,
          paymentMethod,
        },
      },
    }),
  ])

  return prisma.diningTable.findUnique({
    where: { id: tableId },
    include: tableInclude,
  })
}

export async function getAnalytics(): Promise<AnalyticsOverview> {
  const [orders, tables] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    }),
    prisma.tableSession.findMany(),
  ])

  const now = new Date()
  const todayOrders = orders.filter((order) => order.createdAt.toDateString() === now.toDateString())
  const totalRevenue = orders
    .filter((order) => order.status !== PrismaOrderStatus.CANCELLED)
    .reduce((sum, order) => sum + decimalToNumber(order.total), 0)
  const todayRevenue = todayOrders
    .filter((order) => order.status !== PrismaOrderStatus.CANCELLED)
    .reduce((sum, order) => sum + decimalToNumber(order.total), 0)

  const computeSalesByType = (orderList: typeof orders) =>
    orderList.reduce(
      (accumulator, order) => {
        if (order.status === PrismaOrderStatus.CANCELLED) return accumulator
        const amount = decimalToNumber(order.total)
        if (order.type === PrismaOrderType.DELIVERY) accumulator.delivery += amount
        if (order.type === PrismaOrderType.PICKUP) accumulator.pickup += amount
        if (order.type === PrismaOrderType.TABLE) accumulator.table += amount
        return accumulator
      },
      { delivery: 0, pickup: 0, table: 0 }
    )

  const salesByType = computeSalesByType(orders)
  const salesByTypeToday = computeSalesByType(todayOrders)

  const hourlyBuckets = Array.from({ length: 24 }, (_, hour) => ({ hour, revenue: 0 }))
  for (const order of todayOrders) {
    if (order.status === PrismaOrderStatus.CANCELLED) continue
    hourlyBuckets[order.createdAt.getHours()].revenue += decimalToNumber(order.total)
  }

  const productMap = new Map<string, { productName: string; quantity: number; revenue: number; imageUrl?: string }>()
  for (const order of orders) {
    if (order.status === PrismaOrderStatus.CANCELLED) continue
    for (const item of order.items) {
      const key = item.productId ?? item.productName
      const current = productMap.get(key) ?? {
        productName: item.productName,
        quantity: 0,
        revenue: 0,
        imageUrl: item.imageUrl ?? undefined,
      }
      current.quantity += item.quantity
      current.revenue += decimalToNumber(item.unitPrice) * item.quantity
      if (!current.imageUrl && item.imageUrl) current.imageUrl = item.imageUrl
      productMap.set(key, current)
    }
  }

  const mapProducts = (sortBy: 'quantity' | 'revenue') =>
    [...productMap.entries()]
      .map(([productId, value]) => ({
        productId,
        productName: value.productName,
        quantity: value.quantity,
        revenue: value.revenue,
        imageUrl: value.imageUrl,
      }))
      .sort((left, right) =>
        sortBy === 'quantity' ? right.quantity - left.quantity : right.revenue - left.revenue
      )
      .slice(0, 5)

  const dailyMap = new Map<string, { revenue: number; orders: number }>()
  for (const order of orders) {
    if (order.status === PrismaOrderStatus.CANCELLED) continue
    const day = order.createdAt.toISOString().slice(0, 10)
    const current = dailyMap.get(day) ?? { revenue: 0, orders: 0 }
    current.revenue += decimalToNumber(order.total)
    current.orders += 1
    dailyMap.set(day, current)
  }

  return {
    todayRevenue,
    todayOrders: todayOrders.length,
    averageTicket: orders.length ? totalRevenue / orders.length : 0,
    totalRevenue,
    activeOrders: orders.filter((order) => ![PrismaOrderStatus.COMPLETED, PrismaOrderStatus.CANCELLED].includes(order.status)).length,
    tablesServed: tables.filter((session) => session.closedAt !== null).length,
    tablesServedToday: tables.filter(
      (session) => session.closedAt && session.closedAt.toDateString() === now.toDateString()
    ).length,
    salesByType,
    salesByTypeToday,
    hourlySalesToday: hourlyBuckets,
    topProducts: mapProducts('quantity'),
    topProductsByRevenue: mapProducts('revenue'),
    dailySales: [...dailyMap.entries()]
      .map(([date, value]) => ({
        date,
        revenue: value.revenue,
        orders: value.orders,
      }))
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(-14),
  }
}

export async function getOrderHistory() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: orderInclude,
  })

  return orders.map(serializeOrder)
}

export async function upsertCategory(id: string | null, payload: z.infer<typeof categoryInputSchema>) {
  const input = categoryInputSchema.parse(payload)

  if (id) {
    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: input.name,
        slug: slugify(input.name),
        icon: input.icon,
        sortOrder: input.order,
        active: input.active,
      },
    })
    return serializeCategory(updated)
  }

  const created = await prisma.category.create({
    data: {
      name: input.name,
      slug: slugify(input.name),
      icon: input.icon,
      sortOrder: input.order,
      active: input.active,
    },
  })
  return serializeCategory(created)
}

export async function upsertProduct(id: string | null, payload: z.infer<typeof productInputSchema>) {
  const input = productInputSchema.parse(payload)

  if (id) {
    await prisma.productOption.deleteMany({ where: { productId: id } })
    await prisma.productImage.deleteMany({ where: { productId: id } })
  }

  const baseData = {
    name: input.name,
    slug: slugify(input.name),
    description: input.description,
    basePrice: input.price,
    imageUrl: input.image,
    categoryId: input.categoryId,
    featured: input.featured,
    available: input.available,
    preparationTime: input.preparationTime,
    trackStock: input.trackStock,
    stock: input.trackStock ? (input.stock ?? 0) : null,
    lowStockThreshold: input.lowStockThreshold,
    images: {
      create: [
        {
          url: input.image,
          alt: input.name,
          sortOrder: 0,
        },
      ],
    },
    options: {
      create: input.options.map((option, optionIndex) => ({
        name: option.name,
        required: option.required,
        multiple: option.multiple,
        sortOrder: optionIndex,
        choices: {
          create: option.choices.map((choice, choiceIndex) => ({
            name: choice.name,
            priceModifier: choice.priceModifier,
            sortOrder: choiceIndex,
          })),
        },
      })),
    },
  } satisfies Prisma.ProductUncheckedCreateInput

  if (id) {
    const updated = await prisma.product.update({
      where: { id },
      data: baseData,
      include: productInclude,
    })
    return serializeProduct(updated)
  }

  const created = await prisma.product.create({
    data: baseData,
    include: productInclude,
  })
  return serializeProduct(created)
}

export async function upsertPromotion(id: string | null, payload: z.infer<typeof promotionInputSchema>) {
  const input = promotionInputSchema.parse(payload)

  if (id) {
    await prisma.promotionProduct.deleteMany({ where: { promotionId: id } })
    await prisma.promotionCategory.deleteMany({ where: { promotionId: id } })
  }

  const baseData = {
    title: input.title,
    description: input.description,
    imageUrl: input.image,
    discount: input.discount,
    validFrom: new Date(input.validFrom),
    validTo: new Date(input.validTo),
    active: input.active,
    products: {
      create: (input.productIds ?? []).map((productId) => ({
        productId,
      })),
    },
    categories: {
      create: (input.categoryIds ?? []).map((categoryId) => ({
        categoryId,
      })),
    },
  } satisfies Prisma.PromotionUncheckedCreateInput

  if (id) {
    const updated = await prisma.promotion.update({
      where: { id },
      data: baseData,
      include: promotionInclude,
    })
    return serializePromotion(updated)
  }

  const created = await prisma.promotion.create({
    data: baseData,
    include: promotionInclude,
  })
  return serializePromotion(created)
}

export async function updateSettings(payload: z.infer<typeof settingsInputSchema>) {
  const input = settingsInputSchema.parse(payload)

  const settings = await prisma.businessSettings.upsert({
    where: { id: 'main' },
    update: input,
    create: {
      id: 'main',
      ...input,
    },
  })

  return serializeSettings(settings)
}

export async function upsertTable(id: string | null, payload: z.infer<typeof tableInputSchema>) {
  const input = tableInputSchema.parse(payload)

  const baseData = {
    number: input.number,
    capacity: input.capacity,
    status:
      input.status === 'occupied'
        ? PrismaTableStatus.OCCUPIED
        : input.status === 'waiting'
          ? PrismaTableStatus.WAITING
          : input.status === 'finished'
            ? PrismaTableStatus.FINISHED
            : PrismaTableStatus.FREE,
    active: input.active,
  }

  if (id) {
    const updated = await prisma.diningTable.update({
      where: { id },
      data: baseData,
      include: tableInclude,
    })
    return serializeTable(updated)
  }

  const created = await prisma.diningTable.create({
    data: baseData,
    include: tableInclude,
  })
  return serializeTable(created)
}

export async function getAdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      staffRole: true,
      phone: true,
      avatarUrl: true,
      active: true,
    },
  })

  return users.map(serializeUser)
}

async function assertUniquePin(pin: string, excludeUserId?: string) {
  const users = await prisma.user.findMany({
    where: {
      active: true,
      pinHash: { not: null },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true, pinHash: true },
  })

  for (const user of users) {
    if (user.pinHash && (await bcrypt.compare(pin, user.pinHash))) {
      throw new Error('USER_PIN_EXISTS')
    }
  }
}

export async function upsertUser(id: string | null, payload: z.infer<typeof userInputSchema>) {
  const input = userInputSchema.parse(payload)
  const normalizedEmail = input.email.toLowerCase()

  const existingEmailUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  })

  if (existingEmailUser && existingEmailUser.id !== id) {
    throw new Error('USER_EMAIL_EXISTS')
  }

  if (!id && !input.password) {
    throw new Error('USER_PASSWORD_REQUIRED')
  }

  if (input.pin) {
    await assertUniquePin(input.pin, id ?? undefined)
  }

  const baseData = {
    name: input.name,
    email: normalizedEmail,
    role: toPrismaUserRole(input.role),
    staffRole: input.role === 'staff' ? toPrismaStaffRole(input.staffRole ?? 'runner') : null,
    phone: input.phone || null,
    avatarUrl: input.avatar || null,
    active: input.active,
    ...(input.pin ? { pinHash: await bcrypt.hash(input.pin, 10) } : {}),
  }

  const userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    staffRole: true,
    phone: true,
    avatarUrl: true,
    active: true,
  } as const

  if (id) {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...baseData,
        ...(input.password
          ? {
              passwordHash: await bcrypt.hash(input.password, 10),
            }
          : {}),
      },
      select: userSelect,
    })

    return serializeUser(updated)
  }

  const created = await prisma.user.create({
    data: {
      ...baseData,
      passwordHash: await bcrypt.hash(input.password!, 10),
    },
    select: userSelect,
  })

  return serializeUser(created)
}

async function getOrderChannelAvailability(
  orderType: 'delivery' | 'pickup' | 'table',
  settings: Prisma.BusinessSettingsGetPayload<object>
) {
  const [channelSettings, schedules] = await Promise.all([
    prisma.channelSettings.findMany(),
    prisma.channelSchedule.findMany({ orderBy: [{ channel: 'asc' }, { sortOrder: 'asc' }] }),
  ])

  return getChannelAvailability(
    mapOrderTypeToChannel(orderType),
    new Date(),
    serializeSettings(settings),
    channelSettings.map((entry) => ({
      channel: mapPrismaChannel(entry.channel),
      enabled: entry.enabled,
    })),
    schedules.map((entry) => ({
      id: entry.id,
      channel: mapPrismaChannel(entry.channel),
      label: entry.label,
      startTime: entry.startTime,
      endTime: entry.endTime,
      daysOfWeek: entry.daysOfWeek,
      active: entry.active,
      sortOrder: entry.sortOrder,
    }))
  )
}

export async function getChannelSchedulesData(): Promise<{
  schedules: ChannelSchedule[]
  channelSettings: ChannelSetting[]
}> {
  const [schedules, channelSettings] = await Promise.all([
    prisma.channelSchedule.findMany({ orderBy: [{ channel: 'asc' }, { sortOrder: 'asc' }] }),
    prisma.channelSettings.findMany(),
  ])

  return {
    schedules: schedules.map((entry) => ({
      id: entry.id,
      channel: mapPrismaChannel(entry.channel),
      label: entry.label,
      startTime: entry.startTime,
      endTime: entry.endTime,
      daysOfWeek: entry.daysOfWeek,
      active: entry.active,
      sortOrder: entry.sortOrder,
    })),
    channelSettings: channelSettings.map((entry) => ({
      channel: mapPrismaChannel(entry.channel),
      enabled: entry.enabled,
    })),
  }
}

export const channelScheduleInputSchema = z.object({
  id: z.string().optional(),
  channel: z.enum(['delivery', 'local', 'pickup']),
  label: z.string().trim().min(1).max(80),
  startTime: z.string().trim().min(4).max(5),
  endTime: z.string().trim().min(4).max(5),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
})

export async function upsertChannelSchedule(payload: z.infer<typeof channelScheduleInputSchema>) {
  const input = channelScheduleInputSchema.parse(payload)
  const data = {
    channel: mapToPrismaChannel(input.channel),
    label: input.label,
    startTime: input.startTime,
    endTime: input.endTime,
    daysOfWeek: input.daysOfWeek,
    active: input.active,
    sortOrder: input.sortOrder,
  }

  if (input.id) {
    const updated = await prisma.channelSchedule.update({
      where: { id: input.id },
      data,
    })
    return {
      id: updated.id,
      channel: mapPrismaChannel(updated.channel),
      label: updated.label,
      startTime: updated.startTime,
      endTime: updated.endTime,
      daysOfWeek: updated.daysOfWeek,
      active: updated.active,
      sortOrder: updated.sortOrder,
    } satisfies ChannelSchedule
  }

  const created = await prisma.channelSchedule.create({ data })
  return {
    id: created.id,
    channel: mapPrismaChannel(created.channel),
    label: created.label,
    startTime: created.startTime,
    endTime: created.endTime,
    daysOfWeek: created.daysOfWeek,
    active: created.active,
    sortOrder: created.sortOrder,
  } satisfies ChannelSchedule
}

export async function deleteChannelSchedule(id: string) {
  await prisma.channelSchedule.delete({ where: { id } })
}

export async function updateChannelSettings(channel: ChannelSetting['channel'], enabled: boolean) {
  const updated = await prisma.channelSettings.upsert({
    where: { channel: mapToPrismaChannel(channel) },
    update: { enabled },
    create: { channel: mapToPrismaChannel(channel), enabled },
  })

  return {
    channel: mapPrismaChannel(updated.channel),
    enabled: updated.enabled,
  } satisfies ChannelSetting
}
