'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Coffee,
  ChevronLeft,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTrackedOrders } from '@/lib/store'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import type { OrderStatus } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const statusSteps: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'pending', label: 'Pendiente', icon: Clock },
  { status: 'confirmed', label: 'Confirmado', icon: CheckCircle2 },
  { status: 'preparing', label: 'Preparando', icon: Package },
  { status: 'ready', label: 'Listo', icon: CheckCircle2 },
]

export function OrderStatusPage() {
  const [searchId, setSearchId] = useState('')
  const { orders } = useTrackedOrders(searchId)

  const filteredOrders = orders.filter(order => 
    order.type !== 'table' && 
    (searchId === '' || order.id.toLowerCase().includes(searchId.toLowerCase()))
  )

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'cancelled') return -1
    if (status === 'completed' || status === 'delivered') return statusSteps.length
    return statusSteps.findIndex(s => s.status === status)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Coffee className="h-6 w-6 text-primary" />
            <span className="font-serif text-lg font-bold">Estado del Pedido</span>
          </div>
        </div>
        <div className="container px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número de pedido..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon="package"
            title="Sin pedidos"
            description={searchId ? 'No encontramos pedidos con ese número' : 'Aún no tienes pedidos activos'}
            action={{
              label: 'Hacer un pedido',
              onClick: () => window.location.href = '/menu',
            }}
          />
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order, index) => {
              const currentStep = getStepIndex(order.status)
              const isCancelled = order.status === 'cancelled'
              const isComplete = order.status === 'completed' || order.status === 'delivered'

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Pedido #{order.id}
                        </CardTitle>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(order.createdAt, { addSuffix: true, locale: es })}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress Steps */}
                      {!isCancelled && (
                        <div className="relative">
                          <div className="flex justify-between">
                            {statusSteps.map((step, stepIndex) => {
                              const StepIcon = step.icon
                              const isActive = stepIndex <= currentStep || isComplete
                              const isCurrent = stepIndex === currentStep && !isComplete

                              return (
                                <div
                                  key={step.status}
                                  className="flex flex-col items-center"
                                >
                                  <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                                      isActive
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-muted bg-background text-muted-foreground'
                                    } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                                  >
                                    <StepIcon className="h-5 w-5" />
                                  </div>
                                  <span
                                    className={`mt-2 text-xs ${
                                      isActive ? 'font-medium' : 'text-muted-foreground'
                                    }`}
                                  >
                                    {step.label}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                          {/* Progress Line */}
                          <div className="absolute left-0 right-0 top-5 -z-10 h-0.5 bg-muted">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: isComplete
                                  ? '100%'
                                  : `${(currentStep / (statusSteps.length - 1)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {isCancelled && (
                        <div className="flex items-center justify-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
                          <XCircle className="h-5 w-5" />
                          <span className="font-medium">Pedido cancelado</span>
                        </div>
                      )}

                      {/* Order Items */}
                      <div className="rounded-lg bg-muted/50 p-3">
                        <h4 className="mb-2 text-sm font-medium">Productos</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {order.items.map(item => (
                            <div key={item.id} className="flex justify-between">
                              <span>{item.quantity}x {item.product.name}</span>
                              <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 flex justify-between border-t pt-2 font-medium">
                          <span>Total</span>
                          <span className="font-serif">${order.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Order Type */}
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {order.type === 'delivery' ? 'Delivery' : 'Recoger en tienda'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
