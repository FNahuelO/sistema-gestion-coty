'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { formatPrice } from '@/lib/coty-theme'
import { PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN } from '@/lib/panel-theme'
import { useCatalog } from '@/lib/store'
import type { CartItem, Product, SelectedOption, Table } from '@/lib/types'
import { ProductDetailModal } from '@/components/customer/product-detail-modal'
import { cn } from '@/lib/utils'

type AdminTableOrderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tables: Table[]
  products: Product[]
  onSubmit: (tableId: string, items: Array<{ productId: string; quantity: number; selectedOptions: SelectedOption[]; notes?: string }>) => Promise<void>
}

export function AdminTableOrderDialog({
  open,
  onOpenChange,
  tables,
  products,
  onSubmit,
}: AdminTableOrderDialogProps) {
  const [tableId, setTableId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [orderItems, setOrderItems] = useState<CartItem[]>([])
  const [productPicker, setProductPicker] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { products: catalogProducts, isLoading: catalogLoading } = useCatalog()

  const sourceProducts = products.length > 0 ? products : catalogProducts

  const availableTables = useMemo(
    () => tables.filter((table) => table.active !== false && table.status !== 'finished'),
    [tables]
  )

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const available = sourceProducts.filter((product) => product.available !== false)

    if (!query) return []

    return available.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        (product.description?.toLowerCase().includes(query) ?? false)
    )
  }, [sourceProducts, searchQuery])

  const reset = () => {
    setTableId('')
    setSearchQuery('')
    setOrderItems([])
    setProductPicker(null)
  }

  const handleAddProduct = (
    product: Product,
    quantity: number,
    selectedOptions: SelectedOption[],
    notes?: string
  ) => {
    setOrderItems((previous) => [
      ...previous,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        product,
        quantity,
        selectedOptions,
        notes,
      },
    ])
    toast.success(`${product.name} agregado`)
  }

  const handleSubmit = async () => {
    if (!tableId) {
      toast.error('Seleccioná una mesa')
      return
    }
    if (orderItems.length === 0) {
      toast.error('Agregá al menos un producto')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(
        tableId,
        orderItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          notes: item.notes,
        }))
      )
      toast.success('Pedido cargado')
      reset()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) reset()
          onOpenChange(next)
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle>Cargar nueva orden</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Select value={tableId} onValueChange={setTableId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar mesa" />
              </SelectTrigger>
              <SelectContent>
                {availableTables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    Mesa {String(table.number).padStart(2, '0')} · {table.capacity} pers.
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-40 rounded-lg border">
              <div className="space-y-1 p-2">
                {catalogLoading && sourceProducts.length === 0 ? (
                  <div className="flex justify-center py-6">
                    <Spinner />
                  </div>
                ) : searchQuery.trim().length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                    Escribí el nombre del producto para buscar
                  </p>
                ) : filteredProducts.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                    Sin resultados para &ldquo;{searchQuery.trim()}&rdquo;
                  </p>
                ) : (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-[#F0F7F6]"
                      onClick={() => {
                        if (product.options?.length) {
                          setProductPicker(product)
                          return
                        }
                        handleAddProduct(product, 1, [])
                      }}
                    >
                      <span>{product.name}</span>
                      <span className="text-xs text-muted-foreground">{formatPrice(product.price)}</span>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>

            {orderItems.length > 0 && (
              <div className="rounded-lg border bg-[#F8FBFA] p-3 text-sm">
                <p className="mb-2 font-medium">Carrito ({orderItems.length})</p>
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between gap-2 py-1">
                    <span>
                      {item.quantity}x {item.product.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-destructive"
                      onClick={() => setOrderItems((previous) => previous.filter((entry) => entry.id !== item.id))}
                    >
                      Quitar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" className={PANEL_OUTLINE_BTN} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className={cn(PANEL_PRIMARY_BTN)} disabled={submitting} onClick={() => void handleSubmit()}>
              Enviar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {productPicker ? (
        <ProductDetailModal
          product={productPicker}
          onClose={() => setProductPicker(null)}
          onAddToCart={(product, quantity, selectedOptions, notes) => {
            handleAddProduct(product, quantity, selectedOptions, notes)
            setProductPicker(null)
          }}
        />
      ) : null}
    </>
  )
}
