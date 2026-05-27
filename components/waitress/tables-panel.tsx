'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Coffee,
  Users,
  LogOut,
  Menu,
  X,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  ChevronRight,
  Minus,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth, useCatalog, useOrders, useTables } from '@/lib/store'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import type { Table, Product, CartItem, TableStatus } from '@/lib/types'
import { toast } from 'sonner'

const tableStatusColors: Record<TableStatus, string> = {
  free: 'bg-green-500',
  occupied: 'bg-primary',
  waiting: 'bg-yellow-500',
  finished: 'bg-blue-500',
}

const tableStatusIcons: Record<TableStatus, React.ElementType> = {
  free: CheckCircle,
  occupied: Coffee,
  waiting: Clock,
  finished: CreditCard,
}

export function WaitressPanel() {
  const { user, logout } = useAuth()
  const { tables, updateTableStatus, closeTable, createTableOrder } = useTables()
  const { orders } = useOrders()
  const { products, categories } = useCatalog()
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [orderItems, setOrderItems] = useState<CartItem[]>([])
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const myTables = tables.filter(t => t.waitressId === user?.id || t.status === 'free')

  const getTableOrder = (tableId: string) => {
    const table = tables.find(t => t.id === tableId)
    if (table?.currentOrderId) {
      return orders.find(o => o.id === table.currentOrderId)
    }
    return null
  }

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table)
    const existingOrder = getTableOrder(table.id)
    if (existingOrder) {
      setOrderItems([...existingOrder.items])
    } else {
      setOrderItems([])
    }
  }

  const handleAddProduct = (product: Product) => {
    setOrderItems(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, {
        id: `item-${Date.now()}`,
        product,
        quantity: 1,
        selectedOptions: [],
      }]
    })
    toast.success(`${product.name} agregado`)
  }

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setOrderItems(prev => {
      const updated = prev.map(item => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta
          return newQty > 0 ? { ...item, quantity: newQty } : item
        }
        return item
      }).filter(item => item.quantity > 0)
      return updated
    })
  }

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId))
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }

  const handleSendOrder = async () => {
    if (!selectedTable || orderItems.length === 0) return

    try {
      await createTableOrder(selectedTable.id, {
        items: orderItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          notes: item.notes,
        })),
      })
      await updateTableStatus(selectedTable.id, 'occupied')
      toast.success('Pedido enviado a cocina')
      setSelectedTable(null)
      setOrderItems([])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar el pedido')
    }
  }

  const handleCloseTable = async (table: Table) => {
    try {
      await closeTable(table.id)
      toast.success(`Mesa ${table.number} cerrada`)
      setSelectedTable(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cerrar la mesa')
    }
  }

  const handleMarkReady = async (table: Table) => {
    try {
      await updateTableStatus(table.id, 'finished')
      toast.success(`Mesa ${table.number} lista para cobrar`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la mesa')
    }
  }

  const filteredProducts = products.filter(p =>
    p.available &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Coffee className="h-5 w-5 text-primary" />
                    Coty Café
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                    <Avatar>
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-sm text-muted-foreground">Mesero/a</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={async () => {
                      await logout()
                      window.location.href = '/login'
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <span className="font-serif text-lg font-bold">Mesas</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {tables.filter(t => t.status === 'free').length} libres
            </Badge>
          </div>
        </div>
      </header>

      {/* Tables Grid */}
      <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Estado de Mesas</h2>
          <p className="text-sm text-muted-foreground">
            Toca una mesa para gestionar el pedido
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {Object.entries(tableStatusColors).map(([status, color]) => {
            const Icon = tableStatusIcons[status as TableStatus]
            const count = tables.filter(t => t.status === status).length
            return (
              <Badge key={status} variant="outline" className="gap-1.5">
                <span className={`h-2 w-2 rounded-full ${color}`} />
                <Icon className="h-3 w-3" />
                <StatusBadge status={status as TableStatus} className="border-0 bg-transparent p-0" />
                <span>({count})</span>
              </Badge>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {tables.map((table, index) => {
            const StatusIcon = tableStatusIcons[table.status]
            const order = getTableOrder(table.id)
            
            return (
              <motion.button
                key={table.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelectTable(table)}
                className={`relative overflow-hidden rounded-xl border-2 bg-card p-4 text-left transition-all hover:shadow-lg ${
                  selectedTable?.id === table.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-muted'
                }`}
              >
                <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rounded-full opacity-20 ${tableStatusColors[table.status]}`} />
                
                <div className="flex items-center justify-between">
                  <span className="font-serif text-2xl font-bold">{table.number}</span>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${tableStatusColors[table.status]} text-white`}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                </div>
                
                <div className="mt-2">
                  <StatusBadge status={table.status} />
                </div>
                
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{table.capacity} personas</span>
                </div>

                {order && (
                  <div className="mt-2 rounded bg-muted/50 px-2 py-1 text-xs">
                    {order.items.length} productos • ${order.total.toFixed(0)}
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </main>

      {/* Table Detail Modal */}
      <Dialog open={!!selectedTable} onOpenChange={(open) => !open && setSelectedTable(null)}>
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Mesa {selectedTable?.number}</span>
              {selectedTable && <StatusBadge status={selectedTable.status} />}
            </DialogTitle>
          </DialogHeader>

          <div className="flex max-h-[60vh] flex-col gap-4 overflow-hidden">
            {/* Order Items */}
            <div className="flex-1 overflow-y-auto">
              {orderItems.length === 0 ? (
                <EmptyState
                  icon="cart"
                  title="Sin productos"
                  description="Agrega productos al pedido de esta mesa"
                />
              ) : (
                <div className="space-y-2">
                  {orderItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-12 w-12 rounded-md object-cover"
                        />
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${item.product.price} c/u
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            {orderItems.length > 0 && (
              <div className="rounded-lg bg-muted p-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IVA (16%)</span>
                  <span>${(calculateTotal() * 0.16).toFixed(2)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t pt-2 font-bold">
                  <span>Total</span>
                  <span className="font-serif">${(calculateTotal() * 1.16).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setAddProductOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Agregar Producto
            </Button>
            
            {selectedTable?.status === 'occupied' && (
              <Button
                variant="secondary"
                onClick={() => selectedTable && handleMarkReady(selectedTable)}
              >
                Marcar Listo
              </Button>
            )}
            
            {selectedTable?.status === 'finished' && (
              <Button
                variant="destructive"
                onClick={() => selectedTable && handleCloseTable(selectedTable)}
              >
                Cerrar Mesa
              </Button>
            )}
            
            {orderItems.length > 0 && selectedTable?.status !== 'finished' && (
              <Button onClick={handleSendOrder}>
                Enviar Pedido
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Modal */}
      <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
          </DialogHeader>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[50vh]">
            <div className="space-y-4 pr-4">
              {categories.map(category => {
                const categoryProducts = filteredProducts.filter(p => p.categoryId === category.id)
                if (categoryProducts.length === 0) return null
                
                return (
                  <div key={category.id}>
                    <h3 className="mb-2 font-medium text-muted-foreground">{category.name}</h3>
                    <div className="space-y-2">
                      {categoryProducts.map(product => (
                        <button
                          key={product.id}
                          onClick={() => {
                            handleAddProduct(product)
                          }}
                          className="flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-muted"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-12 w-12 rounded-md object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ${product.price}
                            </p>
                          </div>
                          <Plus className="h-5 w-5 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
