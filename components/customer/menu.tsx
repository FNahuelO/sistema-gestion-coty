'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Coffee,
  ShoppingBag,
  Search,
  X,
  Plus,
  Minus,
  ChevronLeft,
  Leaf,
  Snowflake,
  UtensilsCrossed,
  Cake,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useBusiness, useCart, useCatalog } from '@/lib/store'
import type { Product, SelectedOption } from '@/lib/types'
import { EmptyState } from '@/components/shared/empty-state'

const categoryIcons: Record<string, React.ElementType> = {
  coffee: Coffee,
  specialty: Sparkles,
  tea: Leaf,
  cold: Snowflake,
  pastry: Coffee,
  food: UtensilsCrossed,
  dessert: Cake,
}

export function MenuPage() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'

  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)

  const { settings } = useBusiness()
  const { products, categories } = useCatalog()
  const { items, itemCount, total, addItem, removeItem, updateQuantity, clearCart } = useCart()

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch && product.available
    })
  }, [selectedCategory, searchQuery])

  const groupedProducts = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredProducts }
    }
    return filteredProducts.reduce((acc, product) => {
      if (!acc[product.categoryId]) {
        acc[product.categoryId] = []
      }
      acc[product.categoryId].push(product)
      return acc
    }, {} as Record<string, Product[]>)
  }, [filteredProducts, selectedCategory])

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
        <div className="flex h-18 items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <img src="/icon.svg" alt="Coty Café" className="h-10 w-10 rounded-2xl shadow-sm" />
              <div>
                <span className="block font-serif text-lg font-bold">Menú</span>
                <span className="block text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Coty Café</span>
              </div>
            </div>
          </div>

          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative gap-2 rounded-full border-border/70 bg-card/80 px-4 shadow-sm">
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Carrito</span>
                {itemCount > 0 && (
                  <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Tu Pedido</SheetTitle>
              </SheetHeader>
              <CartContent
                items={items}
                total={total}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
                clearCart={clearCart}
                onCheckout={() => setCartOpen(false)}
                taxRate={settings.taxRate}
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Search */}
        <div className="container mx-auto px-4 pb-3">
          <div className="relative rounded-[1.4rem] border border-border/70 bg-card/85 p-2 shadow-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent pl-9 shadow-none"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="container overflow-x-auto px-4 pb-3 scrollbar-hide">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="shrink-0 rounded-full"
            >
              Todos
            </Button>
            {categories.map(category => {
              const Icon = categoryIcons[category.id] || Coffee
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="shrink-0 gap-1.5 rounded-full"
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                </Button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Products */}
      <main className="px-4 py-6">
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon="search"
            title="Sin resultados"
            description="No encontramos productos que coincidan con tu búsqueda"
            action={{
              label: 'Ver todo el menú',
              onClick: () => {
                setSearchQuery('')
                setSelectedCategory('all')
              }
            }}
          />
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedProducts).map(([categoryId, categoryProducts]) => {
              const category = categories.find(c => c.id === categoryId)
              return (
                <section key={categoryId}>
                  {selectedCategory === 'all' && (
                    <h2 className="mb-4 font-serif text-2xl font-bold tracking-tight">
                      {category?.name || categoryId}
                    </h2>
                  )}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {categoryProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="group w-full overflow-hidden rounded-3xl border border-border/70 bg-card/90 text-left transition-all hover:-translate-y-1 hover:shadow-xl"
                        >
                          <div className="relative aspect-square overflow-hidden">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                            {product.featured && (
                              <Badge className="absolute left-2 top-2 bg-accent text-accent-foreground">
                                Popular
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-2 p-4">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-medium leading-tight">{product.name}</h3>
                              <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-[10px] uppercase tracking-[0.18em] text-primary">
                                {product.preparationTime} min
                              </Badge>
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {product.description}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <p className="font-serif text-lg font-bold text-primary">
                                ${product.price}
                              </p>
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <Plus className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(product, quantity, options, notes) => {
          addItem(product, quantity, options, notes)
          setSelectedProduct(null)
        }}
      />

      {/* Floating Cart Button (Mobile) */}
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-4 left-4 right-4 z-30 md:hidden"
        >
          <Button
            className="w-full gap-2 rounded-full py-6 shadow-lg shadow-primary/20"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag className="h-5 w-5" />
            Ver pedido ({itemCount})
            <span className="ml-auto font-serif font-bold">${total.toFixed(2)}</span>
          </Button>
        </motion.div>
      )}
    </div>
  )
}

interface ProductDetailModalProps {
  product: Product | null
  onClose: () => void
  onAddToCart: (product: Product, quantity: number, options: SelectedOption[], notes?: string) => void
}

function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([])
  const [notes, setNotes] = useState('')

  const handleOptionChange = (optionId: string, choiceId: string, multiple: boolean) => {
    setSelectedOptions(prev => {
      const existing = prev.find(o => o.optionId === optionId)

      if (multiple) {
        if (existing) {
          const hasChoice = existing.choiceIds.includes(choiceId)
          if (hasChoice) {
            const newChoices = existing.choiceIds.filter(id => id !== choiceId)
            if (newChoices.length === 0) {
              return prev.filter(o => o.optionId !== optionId)
            }
            return prev.map(o => o.optionId === optionId ? { ...o, choiceIds: newChoices } : o)
          }
          return prev.map(o => o.optionId === optionId ? { ...o, choiceIds: [...o.choiceIds, choiceId] } : o)
        }
        return [...prev, { optionId, choiceIds: [choiceId] }]
      }

      if (existing) {
        return prev.map(o => o.optionId === optionId ? { ...o, choiceIds: [choiceId] } : o)
      }
      return [...prev, { optionId, choiceIds: [choiceId] }]
    })
  }

  const calculatePrice = () => {
    if (!product) return 0
    let price = product.price
    selectedOptions.forEach(option => {
      const productOption = product.options?.find(o => o.id === option.optionId)
      if (productOption) {
        option.choiceIds.forEach(choiceId => {
          const choice = productOption.choices.find(c => c.id === choiceId)
          if (choice) {
            price += choice.priceModifier
          }
        })
      }
    })
    return price * quantity
  }

  const canAddToCart = () => {
    if (!product) return false
    const requiredOptions = product.options?.filter(o => o.required) || []
    return requiredOptions.every(option =>
      selectedOptions.some(so => so.optionId === option.id && so.choiceIds.length > 0)
    )
  }

  // Reset state when product changes
  if (!product) {
    return null
  }

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[1.75rem] border border-border/70 bg-card/95 p-3 shadow-2xl sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="relative aspect-video overflow-hidden rounded-[1.25rem]">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl font-bold">{product.name}</h2>
            <p className="mt-1 text-muted-foreground">{product.description}</p>
          </div>

          {/* Options */}
          {product.options?.map(option => (
            <div key={option.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  {option.name}
                  {option.required && <span className="ml-1 text-destructive">*</span>}
                </Label>
                {!option.required && (
                  <span className="text-xs text-muted-foreground">Opcional</span>
                )}
              </div>

              {option.multiple ? (
                <div className="space-y-2">
                  {option.choices.map(choice => (
                    <div key={choice.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`${option.id}-${choice.id}`}
                          checked={selectedOptions.some(
                            so => so.optionId === option.id && so.choiceIds.includes(choice.id)
                          )}
                          onCheckedChange={() => handleOptionChange(option.id, choice.id, true)}
                        />
                        <Label htmlFor={`${option.id}-${choice.id}`} className="cursor-pointer">
                          {choice.name}
                        </Label>
                      </div>
                      {choice.priceModifier > 0 && (
                        <span className="text-sm text-muted-foreground">
                          +${choice.priceModifier}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <RadioGroup
                  value={selectedOptions.find(so => so.optionId === option.id)?.choiceIds[0] || ''}
                  onValueChange={(value) => handleOptionChange(option.id, value, false)}
                >
                  {option.choices.map(choice => (
                    <div key={choice.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 p-3">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={choice.id} id={`${option.id}-${choice.id}`} />
                        <Label htmlFor={`${option.id}-${choice.id}`} className="cursor-pointer">
                          {choice.name}
                        </Label>
                      </div>
                      {choice.priceModifier > 0 && (
                        <span className="text-sm text-muted-foreground">
                          +${choice.priceModifier}
                        </span>
                      )}
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          ))}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas especiales</Label>
            <Textarea
              placeholder="Ej: Sin azúcar, extra caliente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              className="flex-1 gap-2 rounded-full shadow-lg shadow-primary/20"
              disabled={!canAddToCart()}
              onClick={() => {
                onAddToCart(product, quantity, selectedOptions, notes || undefined)
                setQuantity(1)
                setSelectedOptions([])
                setNotes('')
              }}
            >
              Agregar
              <span className="font-serif font-bold">${calculatePrice().toFixed(2)}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface CartContentProps {
  items: ReturnType<typeof useCart>['items']
  total: number
  updateQuantity: (id: string, qty: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  onCheckout: () => void
  taxRate: number
}

function CartContent({ items, total, updateQuantity, removeItem, clearCart, onCheckout, taxRate }: CartContentProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon="cart"
          title="Carrito vacío"
          description="Agrega productos para comenzar tu pedido"
        />
      </div>
    )
  }

  const tax = total * taxRate
  const finalTotal = total + tax

  return (
    <>
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {items.map(item => {
            const itemPrice = item.product.price + (item.selectedOptions?.reduce((acc, opt) => {
              const productOpt = item.product.options?.find(o => o.id === opt.optionId)
              return acc + (productOpt?.choices.filter(c => opt.choiceIds.includes(c.id)).reduce((sum, c) => sum + c.priceModifier, 0) || 0)
            }, 0) || 0)

            return (
              <div key={item.id} className="flex gap-3 rounded-[1.25rem] border border-border/70 bg-card/80 p-3">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="h-16 w-16 rounded-md object-cover"
                />
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{item.product.name}</h4>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {item.selectedOptions.map(opt => {
                            const productOpt = item.product.options?.find(o => o.id === opt.optionId)
                            return opt.choiceIds.map(cId =>
                              productOpt?.choices.find(c => c.id === cId)?.name
                            ).join(', ')
                          }).join(' • ')}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-medium">
                      ${(itemPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <div className="border-t border-border/70 pt-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IVA ({(taxRate * 100).toFixed(0)}%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 text-base font-bold">
            <span>Total</span>
            <span className="font-serif">${finalTotal.toFixed(2)}</span>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Link href="/checkout" onClick={onCheckout}>
            <Button className="w-full rounded-full">Continuar al pago</Button>
          </Link>
          <Button variant="outline" className="w-full rounded-full" onClick={clearCart}>
            Vaciar carrito
          </Button>
        </div>
      </div>
    </>
  )
}
