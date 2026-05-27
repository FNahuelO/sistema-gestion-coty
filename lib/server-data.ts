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
} from '@prisma/client'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { AnalyticsOverview, BusinessSettings, CartItem, Category, Order, PaymentMethod, Product, Promotion, SelectedOption, Table, User } from '@/lib/types'

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

export const createOrderSchema = z.object({
  type: z.enum(['delivery', 'pickup', 'table']),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'mercado_pago']),
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(3).max(40),
  customerAddress: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(500).optional(),
  tableId: z.string().trim().optional(),
  items: z.array(cartItemInputSchema).min(1),
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
  role: z.enum(['admin', 'cashier', 'waitress']),
  avatar: z.string().trim().url().optional().or(z.literal('')),
  active: z.boolean().default(true),
  password: z.string().min(6).max(120).optional(),
})

const orderInclude = {
  items: {
    include: {
      selections: true,
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
  role: 'admin' | 'cashier' | 'waitress'
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
    case 'CASHIER':
    case 'cashier':
      return 'cashier'
    default:
      return 'waitress'
  }
}

function toPrismaUserRole(role: User['role']): PrismaUserRole {
  switch (role) {
    case 'admin':
      return PrismaUserRole.ADMIN
    case 'cashier':
      return PrismaUserRole.CASHIER
    default:
      return PrismaUserRole.WAITRESS
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
    phone: settings.phone,
    address: settings.address,
    instagram: settings.instagram ?? undefined,
    facebook: settings.facebook ?? undefined,
    whatsapp: settings.whatsapp,
    deliveryFee: decimalToNumber(settings.deliveryFee),
    minOrderAmount: decimalToNumber(settings.minOrderAmount),
    taxRate: decimalToNumber(settings.taxRate),
  }
}

export function serializeUser(user: {
  id: string
  name: string
  email: string
  role: PrismaUserRole | User['role']
  avatarUrl: string | null
  active: boolean
}): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapUserRole(user.role),
    avatar: user.avatarUrl ?? undefined,
    active: user.active,
  }
}

export function serializeOrder(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>): Order {
  return {
    id: order.id,
    displayCode: order.displayCode,
    publicTrackingCode: order.publicTrackingCode,
    type: mapOrderType(order.type),
    status: mapOrderStatus(order.status),
    paymentMethod: mapPaymentMethod(order.paymentMethod),
    paymentStatus: mapPaymentStatus(order.payment?.status),
    paymentUrl: order.payment?.initPoint ?? order.payment?.sandboxInitPoint ?? undefined,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress ?? undefined,
    notes: order.notes ?? undefined,
    subtotal: decimalToNumber(order.subtotal),
    tax: decimalToNumber(order.tax),
    deliveryFee: decimalToNumber(order.deliveryFee),
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
          preparationTime: 0,
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

export async function getPublicCatalog() {
  const [settings, categories, products, promotions] = await Promise.all([
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
  ])

  return {
    settings: settings ? serializeSettings(settings) : null,
    categories: categories.map((category) => serializeCategory(category)),
    products: products.map(serializeProduct),
    promotions: promotions.map(serializePromotion),
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

export async function getTablesSnapshot() {
  const tables = await prisma.diningTable.findMany({
    where: {
      deletedAt: null,
    },
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

function buildWhatsAppMessage(order: Order, settings: BusinessSettings) {
  const itemsList = order.items
    .map((item) => {
      const options = item.selectedOptions
        .map((option) => `${option.optionId}: ${option.choiceIds.join(', ')}`)
        .join(' | ')
      return `• ${item.quantity}x ${item.product.name}${options ? ` (${options})` : ''}`
    })
    .join('\n')

  return `Nuevo pedido - ${settings.name}

Pedido ${order.displayCode ?? order.id}
Cliente: ${order.customerName}
Telefono: ${order.customerPhone}
${order.customerAddress ? `Direccion: ${order.customerAddress}\n` : ''}Productos:
${itemsList}

Total: $${order.total.toFixed(2)}
Pago: ${order.paymentMethod}
Tipo: ${order.type}
${order.notes ? `Notas: ${order.notes}` : ''}`.trim()
}

export async function createOrderFromPayload(payload: z.infer<typeof createOrderSchema>, createdByUserId?: string) {
  const input = createOrderSchema.parse(payload)
  const settings = await prisma.businessSettings.findUnique({ where: { id: 'main' } })

  if (!settings) {
    throw new Error('SETTINGS_NOT_FOUND')
  }

  if (!settings.isOpen && input.type !== 'table') {
    throw new Error('BUSINESS_CLOSED')
  }

  const productIds = [...new Set(input.items.map((item) => item.productId))]
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      deletedAt: null,
      available: true,
    },
    include: productInclude,
  })

  if (products.length !== productIds.length) {
    throw new Error('INVALID_PRODUCTS')
  }

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
      select: { id: true, number: true },
    })

    if (!table) {
      throw new Error('TABLE_NOT_FOUND')
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

    return {
      productId: product.id,
      productName: product.name,
      productDescription: product.description,
      basePrice: decimalToNumber(product.basePrice),
      unitPrice,
      imageUrl: product.images[0]?.url ?? product.imageUrl,
      quantity: item.quantity,
      notes: item.notes,
      selections: normalizedSelections,
    }
  })

  const subtotal = itemsToCreate.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const deliveryFee = input.type === 'delivery' ? decimalToNumber(settings.deliveryFee) : 0
  const tax = subtotal * decimalToNumber(settings.taxRate)
  const total = subtotal + tax + deliveryFee

  const createdOrder = await prisma.order.create({
    data: {
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
      customerName: input.type === 'table' && diningTable ? `Mesa ${diningTable.number}` : input.customerName,
      customerPhone: input.customerPhone,
      customerAddress: input.type === 'delivery' ? input.customerAddress : undefined,
      notes: input.notes,
      subtotal,
      tax,
      deliveryFee,
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
          status: input.paymentMethod === 'mercado_pago' ? 'PENDING' : 'APPROVED',
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
    },
    include: orderInclude,
  })

  if (diningTable?.id) {
    await prisma.diningTable.update({
      where: { id: diningTable.id },
      data: { status: 'OCCUPIED' },
    })
  }

  const serialized = serializeOrder(createdOrder)

  const whatsappMessage = buildWhatsAppMessage(serialized, serializeSettings(settings))
  await prisma.order.update({
    where: { id: createdOrder.id },
    data: {
      whatsappMessage,
    },
  })

  return {
    ...serialized,
    notes: input.notes,
    paymentUrl: createdOrder.payment?.initPoint ?? undefined,
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

export async function createPreferenceForOrder(orderId: string, baseUrl: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  })

  if (!order) {
    throw new Error('ORDER_NOT_FOUND')
  }

  const settings = await prisma.businessSettings.findUnique({
    where: { id: 'main' },
  })

  if (!settings) {
    throw new Error('SETTINGS_NOT_FOUND')
  }

  const preferenceClient = new Preference(getMercadoPagoConfig())
  const response = await preferenceClient.create({
    body: {
      external_reference: order.id,
      notification_url: `${baseUrl}/api/payments/mercadopago/webhook`,
      statement_descriptor: settings.name.slice(0, 13),
      auto_return: 'approved',
      back_urls: {
        success: `${baseUrl}/order-status?status=approved`,
        pending: `${baseUrl}/order-status?status=pending`,
        failure: `${baseUrl}/checkout?status=failure`,
      },
      payer: {
        name: order.customerName,
        email: undefined,
        phone: {
          number: order.customerPhone,
        },
      },
      items: order.items.map((item) => ({
        id: item.productId ?? item.id,
        title: item.productName,
        description: item.productDescription ?? undefined,
        picture_url: item.imageUrl ?? undefined,
        quantity: item.quantity,
        currency_id: 'ARS',
        unit_price: decimalToNumber(item.unitPrice),
      })),
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

  return updated ? serializeOrder(updated) : null
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

  await prisma.payment.updateMany({
    where: {
      OR: [{ orderId: externalReference }, { providerPaymentId: String(paymentResponse.id) }],
    },
    data: {
      providerPaymentId: String(paymentResponse.id),
      status: paymentStatus,
      rawPayload: payload ? (payload as Prisma.InputJsonValue) : (paymentResponse as Prisma.InputJsonValue),
    },
  })

  await prisma.order.update({
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

  const order = await prisma.order.update({
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

  return serializeOrder(order)
}

export async function closeTableAndOrders(tableId: string, userId?: string) {
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

  await prisma.$transaction([
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

  const salesByType = orders.reduce(
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

  const productMap = new Map<string, { productName: string; quantity: number; revenue: number }>()
  for (const order of orders) {
    if (order.status === PrismaOrderStatus.CANCELLED) continue
    for (const item of order.items) {
      const current = productMap.get(item.productId ?? item.productName) ?? {
        productName: item.productName,
        quantity: 0,
        revenue: 0,
      }
      current.quantity += item.quantity
      current.revenue += decimalToNumber(item.unitPrice) * item.quantity
      productMap.set(item.productId ?? item.productName, current)
    }
  }

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
    tablesServed: tables.length,
    salesByType,
    topProducts: [...productMap.entries()]
      .map(([productId, value]) => ({
        productId,
        productName: value.productName,
        quantity: value.quantity,
        revenue: value.revenue,
      }))
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 5),
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
      avatarUrl: true,
      active: true,
    },
  })

  return users.map(serializeUser)
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

  const baseData = {
    name: input.name,
    email: normalizedEmail,
    role: toPrismaUserRole(input.role),
    avatarUrl: input.avatar || null,
    active: input.active,
  }

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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        active: true,
      },
    })

    return serializeUser(updated)
  }

  const created = await prisma.user.create({
    data: {
      ...baseData,
      passwordHash: await bcrypt.hash(input.password!, 10),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      active: true,
    },
  })

  return serializeUser(created)
}
