import 'dotenv/config'
import { PrismaClient, PaymentMethod, PaymentStatus, TableStatus, OrderStatus, OrderType, UserRole } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import { businessSettings, categories, orders, products, promotions, tables, users } from '../lib/mock-data'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/coty_cafe?schema=public',
})

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
})

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function toUserRole(role: string): UserRole {
  switch (role) {
    case 'admin':
      return UserRole.ADMIN
    default:
      return UserRole.STAFF
  }
}

function toOrderType(type: string): OrderType {
  switch (type) {
    case 'delivery':
      return OrderType.DELIVERY
    case 'pickup':
      return OrderType.PICKUP
    default:
      return OrderType.TABLE
  }
}

function toOrderStatus(status: string): OrderStatus {
  switch (status) {
    case 'pending':
      return OrderStatus.PENDING
    case 'confirmed':
      return OrderStatus.CONFIRMED
    case 'preparing':
      return OrderStatus.PREPARING
    case 'ready':
      return OrderStatus.READY
    case 'delivered':
      return OrderStatus.DELIVERED
    case 'completed':
      return OrderStatus.COMPLETED
    default:
      return OrderStatus.CANCELLED
  }
}

function toPaymentMethod(method: string): PaymentMethod {
  switch (method) {
    case 'card':
      return PaymentMethod.CARD
    case 'transfer':
      return PaymentMethod.TRANSFER
    default:
      return PaymentMethod.CASH
  }
}

function toTableStatus(status: string): TableStatus {
  switch (status) {
    case 'occupied':
      return TableStatus.OCCUPIED
    case 'waiting':
      return TableStatus.WAITING
    case 'finished':
      return TableStatus.FINISHED
    default:
      return TableStatus.FREE
  }
}

async function main() {
  const defaultPassword = await bcrypt.hash('cotycafe123', 10)

  await prisma.orderItemSelection.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.orderStatusHistory.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.order.deleteMany()
  await prisma.tableSession.deleteMany()
  await prisma.diningTable.deleteMany()
  await prisma.promotionProduct.deleteMany()
  await prisma.promotionCategory.deleteMany()
  await prisma.promotion.deleteMany()
  await prisma.productChoice.deleteMany()
  await prisma.productOption.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.businessSettings.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  for (const category of categories) {
    await prisma.category.create({
      data: {
        id: category.id,
        slug: slugify(category.name),
        name: category.name,
        icon: category.icon,
        sortOrder: category.order,
      },
    })
  }

  for (const product of products) {
    await prisma.product.create({
      data: {
        id: product.id,
        slug: slugify(product.name),
        name: product.name,
        description: product.description,
        basePrice: product.price,
        imageUrl: product.image,
        featured: product.featured,
        available: product.available,
        preparationTime: product.preparationTime,
        categoryId: product.categoryId,
        images: {
          create: [
            {
              id: `${product.id}-image`,
              url: product.image,
              alt: product.name,
              sortOrder: 0,
            },
          ],
        },
        options: {
          create: (product.options ?? []).map((option, optionIndex) => ({
            id: `${product.id}-${option.id}`,
            name: option.name,
            required: option.required,
            multiple: option.multiple,
            sortOrder: optionIndex,
            choices: {
              create: option.choices.map((choice, choiceIndex) => ({
                id: `${product.id}-${option.id}-${choice.id}`,
                name: choice.name,
                priceModifier: choice.priceModifier,
                sortOrder: choiceIndex,
              })),
            },
          })),
        },
      },
    })
  }

  await prisma.businessSettings.create({
    data: {
      id: 'main',
      name: businessSettings.name,
      logo: businessSettings.logo,
      isOpen: businessSettings.isOpen,
      openTime: businessSettings.openTime,
      closeTime: businessSettings.closeTime,
      phone: businessSettings.phone,
      address: businessSettings.address,
      instagram: businessSettings.instagram,
      facebook: businessSettings.facebook,
      whatsapp: businessSettings.whatsapp,
      deliveryFee: businessSettings.deliveryFee,
      minOrderAmount: businessSettings.minOrderAmount,
      taxRate: businessSettings.taxRate,
    },
  })

  const normalizedUsers = [
    ...users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: toUserRole(user.role),
      avatarUrl: user.avatar,
    })),
    {
      id: 'admin-login',
      name: 'Administrador',
      email: 'admin@cotycafe.com',
      role: UserRole.ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
    {
      id: 'staff-login',
      name: 'Personal Coty',
      email: 'personal@cotycafe.com',
      role: UserRole.STAFF,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
  ]

  for (const user of normalizedUsers) {
    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        passwordHash: defaultPassword,
      },
    })
  }

  for (const table of tables) {
    await prisma.diningTable.create({
      data: {
        id: table.id,
        number: table.number,
        capacity: table.capacity,
        status: toTableStatus(table.status),
      },
    })
  }

  for (const table of tables) {
    if (table.status === 'free' && !table.waitressId) continue

    await prisma.tableSession.create({
      data: {
        id: `session-${table.id}`,
        tableId: table.id,
        waitressId: table.waitressId,
        openedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        accumulatedTotal: 0,
      },
    })
  }

  for (let index = 0; index < promotions.length; index += 1) {
    const promotion = promotions[index]
    await prisma.promotion.create({
      data: {
        id: promotion.id,
        title: promotion.title,
        description: promotion.description,
        imageUrl: promotion.image,
        discount: promotion.discount,
        validFrom: promotion.validFrom,
        validTo: promotion.validTo,
        active: promotion.active,
        products: {
          create: (promotion.productIds ?? []).map((productId) => ({
            productId,
          })),
        },
        categories: {
          create: (promotion.categoryIds ?? []).map((categoryId) => ({
            categoryId,
          })),
        },
      },
    })
  }

  for (let index = 0; index < orders.length; index += 1) {
    const order = orders[index]

    await prisma.order.create({
      data: {
        id: order.id,
        displayCode: `ORD-${String(index + 1).padStart(4, '0')}`,
        publicTrackingCode: `TRACK-${String(index + 1).padStart(6, '0')}`,
        type: toOrderType(order.type),
        status: toOrderStatus(order.status),
        paymentMethod: toPaymentMethod(order.paymentMethod),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        notes: order.notes,
        subtotal: order.subtotal,
        tax: order.tax,
        deliveryFee: order.type === 'delivery' ? businessSettings.deliveryFee : 0,
        total: order.total,
        diningTableId: order.tableId,
        tableSessionId: order.tableId ? `session-${order.tableId}` : undefined,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: {
          create: order.items.map((item, itemIndex) => {
            const selectedChoices = item.selectedOptions.flatMap((selected) => {
              const productOption = item.product.options?.find((option) => option.id === selected.optionId)
              return selected.choiceIds.map((choiceId) => {
                const choice = productOption?.choices.find((candidate) => candidate.id === choiceId)
                return {
                  optionName: productOption?.name ?? selected.optionId,
                  choiceName: choice?.name ?? choiceId,
                  priceModifier: choice?.priceModifier ?? 0,
                }
              })
            })

            const modifiers = selectedChoices.reduce((sum, choice) => sum + Number(choice.priceModifier), 0)

            return {
              id: item.id || `${order.id}-item-${itemIndex + 1}`,
              productId: item.product.id,
              productName: item.product.name,
              productDescription: item.product.description,
              basePrice: item.product.price,
              unitPrice: item.product.price + modifiers,
              imageUrl: item.product.image,
              quantity: item.quantity,
              notes: item.notes,
              selections: {
                create: selectedChoices.map((choice, choiceIndex) => ({
                  id: `${order.id}-${itemIndex + 1}-choice-${choiceIndex + 1}`,
                  optionName: choice.optionName,
                  choiceName: choice.choiceName,
                  priceModifier: choice.priceModifier,
                })),
              },
            }
          }),
        },
        payment: {
          create: {
            provider: 'manual',
            method: toPaymentMethod(order.paymentMethod),
            status:
              order.status === 'completed' || order.status === 'delivered'
                ? PaymentStatus.APPROVED
                : PaymentStatus.PENDING,
            amount: order.total,
          },
        },
        statusHistory: {
          create: {
            status: toOrderStatus(order.status),
            note: 'Estado inicial importado desde datos de demostración',
          },
        },
      },
    })
  }

  for (const table of tables) {
    const totalForTable = orders
      .filter((order) => order.tableId === table.id && order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.total, 0)

    if (table.status === 'free' && !table.waitressId) continue

    await prisma.tableSession.update({
      where: { id: `session-${table.id}` },
      data: {
        accumulatedTotal: totalForTable,
      },
    })
  }

  console.log('Seed completado. Usuarios de prueba: admin@cotycafe.com, personal@cotycafe.com')
  console.log('Contraseña de prueba: cotycafe123')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
