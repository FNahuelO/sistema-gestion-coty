'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ArrowUpDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { formatPrice } from '@/lib/coty-theme'
import { PANEL_CARD, PANEL_LIST_ROW, PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN, PANEL_TITLE, PANEL_TOGGLE_ROW, PANEL_BADGE, PANEL_BORDER, PANEL_BTN_GHOST, PANEL_ICON_ACTIVE, PANEL_INPUT, PANEL_MUTED_BADGE } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import { useAdminData } from '@/lib/store'
import type { Product } from '@/lib/types'
import { ImageUploadField } from '@/components/admin/forms/image-upload-field'
import { ProductOptionsEditor, normalizeProductOptions } from '@/components/admin/forms/product-options-editor'
import { useFormPanel } from '../hooks/use-form-panel'
import { emptyProductForm } from '../types'
import type { ProductFormState } from '../types'
import { AdminFormPanel } from '../ui/admin-form-panel'
import { AdminPageHeader } from '../ui/admin-page-header'
import { Field } from '../ui/field'

const PRODUCTS_PAGE_SIZE = 20

type ProductSortKey = 'name' | 'price-asc' | 'price-desc'
type AvailabilityFilter = 'all' | 'available' | 'unavailable'

const SORT_OPTIONS: { value: ProductSortKey; label: string }[] = [
  { value: 'name', label: 'Nombre A-Z' },
  { value: 'price-asc', label: 'Precio menor' },
  { value: 'price-desc', label: 'Precio mayor' },
]

function sortProducts(products: Product[], sortBy: ProductSortKey) {
  const sorted = [...products]
  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((left, right) => left.price - right.price)
    case 'price-desc':
      return sorted.sort((left, right) => right.price - left.price)
    default:
      return sorted.sort((left, right) => left.name.localeCompare(right.name, 'es'))
  }
}

export function ProductsSection() {
  const admin = useAdminData()
  const { open, setOpen, openPanel } = useFormPanel('products')
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all')
  const [sortBy, setSortBy] = useState<ProductSortKey>('name')
  const [page, setPage] = useState(0)

  const productCategoryOptions = useMemo(
    () => admin.categories.map((category) => ({ value: category.id, label: category.name })),
    [admin.categories]
  )

  const categoryNameById = useMemo(
    () => Object.fromEntries(admin.categories.map((category) => [category.id, category.name])),
    [admin.categories]
  )

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const matches = admin.products.filter((product) => {
      if (categoryFilter !== 'all' && product.categoryId !== categoryFilter) return false
      if (availabilityFilter === 'available' && !product.available) return false
      if (availabilityFilter === 'unavailable' && product.available) return false
      if (!query) return true

      return (
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        (categoryNameById[product.categoryId]?.toLowerCase().includes(query) ?? false)
      )
    })

    return sortProducts(matches, sortBy)
  }, [admin.products, availabilityFilter, categoryFilter, categoryNameById, searchQuery, sortBy])

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PAGE_SIZE))
  const paginatedProducts = filteredProducts.slice(
    page * PRODUCTS_PAGE_SIZE,
    (page + 1) * PRODUCTS_PAGE_SIZE
  )

  const hasActiveFilters =
    searchQuery.trim().length > 0 || categoryFilter !== 'all' || availabilityFilter !== 'all'

  useEffect(() => {
    setPage(0)
  }, [searchQuery, categoryFilter, availabilityFilter, sortBy])

  useEffect(() => {
    if (page > pageCount - 1) {
      setPage(Math.max(0, pageCount - 1))
    }
  }, [page, pageCount])

  const loadProduct = (product: Product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      categoryId: product.categoryId,
      featured: product.featured,
      available: product.available,
      preparationTime: product.preparationTime,
      trackStock: product.trackStock ?? false,
      stock: product.stock ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      options: (product.options ?? []).map((option) => ({
        ...option,
        choices: option.choices.map((choice) => ({ ...choice })),
      })),
    })
    openPanel()
  }

  const submitProduct = async () => {
    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: productForm.price,
        image: productForm.image,
        categoryId: productForm.categoryId,
        featured: productForm.featured,
        available: productForm.available,
        preparationTime: productForm.preparationTime,
        trackStock: productForm.trackStock,
        stock: productForm.trackStock ? productForm.stock : undefined,
        lowStockThreshold: productForm.lowStockThreshold,
        options: normalizeProductOptions(productForm.options),
      }

      if (productForm.id) {
        await admin.updateProduct(productForm.id, payload)
        toast.success('Producto actualizado')
      } else {
        await admin.addProduct(payload)
        toast.success('Producto creado')
      }

      setProductForm(emptyProductForm())
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el producto')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <AdminPageHeader
        title="Productos"
        description="Gestioná el menú y sus opciones"
        onNew={() => {
          setProductForm(emptyProductForm())
          openPanel()
        }}
      />
      <AdminFormPanel
          panelId="products"
          title={productForm.id ? 'Editar producto' : 'Nuevo producto'}
          open={open}
          onOpenChange={setOpen}
        >
          <Field label="Nombre">
            <Input value={productForm.name} onChange={(event) => setProductForm((previous) => ({ ...previous, name: event.target.value }))} />
          </Field>
          <Field label="Descripción">
            <Textarea value={productForm.description} onChange={(event) => setProductForm((previous) => ({ ...previous, description: event.target.value }))} />
          </Field>
          <Field label="Imagen">
            <ImageUploadField
              folder="products"
              value={productForm.image}
              onChange={(url) => setProductForm((previous) => ({ ...previous, image: url }))}
            />
          </Field>
          <Field label="Precio">
            <Input type="number" value={productForm.price} onChange={(event) => setProductForm((previous) => ({ ...previous, price: Number(event.target.value) }))} />
          </Field>
          <Field label="Tiempo de preparación (min)">
            <Input type="number" value={productForm.preparationTime} onChange={(event) => setProductForm((previous) => ({ ...previous, preparationTime: Number(event.target.value) }))} />
          </Field>
          <div className={PANEL_TOGGLE_ROW}>
            <Label>Controlar stock</Label>
            <Switch checked={productForm.trackStock} onCheckedChange={(checked) => setProductForm((previous) => ({ ...previous, trackStock: checked }))} />
          </div>
          {productForm.trackStock ? (
            <>
              <Field label="Stock actual">
                <Input type="number" min={0} value={productForm.stock} onChange={(event) => setProductForm((previous) => ({ ...previous, stock: Number(event.target.value) }))} />
              </Field>
              <Field label="Alerta stock bajo">
                <Input type="number" min={0} value={productForm.lowStockThreshold} onChange={(event) => setProductForm((previous) => ({ ...previous, lowStockThreshold: Number(event.target.value) }))} />
              </Field>
            </>
          ) : null}
          <Field label="Categoría">
            <Select value={productForm.categoryId} onValueChange={(value) => setProductForm((previous) => ({ ...previous, categoryId: value }))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
              <SelectContent>
                {productCategoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Opciones del producto">
            <ProductOptionsEditor
              value={productForm.options}
              onChange={(options) => setProductForm((previous) => ({ ...previous, options }))}
            />
          </Field>
          <div className={PANEL_TOGGLE_ROW}>
            <Label>Destacado</Label>
            <Switch checked={productForm.featured} onCheckedChange={(checked) => setProductForm((previous) => ({ ...previous, featured: checked }))} />
          </div>
          <div className={PANEL_TOGGLE_ROW}>
            <Label>Disponible</Label>
            <Switch checked={productForm.available} onCheckedChange={(checked) => setProductForm((previous) => ({ ...previous, available: checked }))} />
          </div>
          <div className="flex gap-2">
            <Button className={cn('flex-1', PANEL_PRIMARY_BTN)} onClick={() => submitProduct()}>Guardar</Button>
            <Button variant="outline" className={PANEL_OUTLINE_BTN} onClick={() => setProductForm(emptyProductForm())}>Limpiar</Button>
          </div>
        </AdminFormPanel>

      <Card className={PANEL_CARD}>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className={PANEL_TITLE}>Listado</CardTitle>
              <p className="text-xs text-muted-foreground">
                {filteredProducts.length === admin.products.length
                  ? `${admin.products.length} productos`
                  : `${filteredProducts.length} de ${admin.products.length} productos`}
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, descripción o categoría..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className={cn(PANEL_INPUT, 'pl-9')}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className={PANEL_INPUT}>
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {productCategoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={availabilityFilter}
                  onValueChange={(value) => setAvailabilityFilter(value as AvailabilityFilter)}
                >
                  <SelectTrigger className={PANEL_INPUT}>
                    <SelectValue placeholder="Disponibilidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="available">Disponibles</SelectItem>
                    <SelectItem value="unavailable">No disponibles</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value) => setSortBy(value as ProductSortKey)}>
                  <SelectTrigger className={PANEL_INPUT}>
                    <ArrowUpDown className={cn('mr-2 h-4 w-4 shrink-0', PANEL_ICON_ACTIVE)} />
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn('h-8 px-2 text-xs', PANEL_BTN_GHOST)}
                  onClick={() => {
                    setSearchQuery('')
                    setCategoryFilter('all')
                    setAvailabilityFilter('all')
                    setSortBy('name')
                  }}
                >
                  Limpiar filtros
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {paginatedProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {hasActiveFilters ? 'No hay productos que coincidan con los filtros' : 'No hay productos cargados'}
              </p>
            ) : (
              paginatedProducts.map((product) => (
              <div key={product.id} className={cn(PANEL_LIST_ROW, 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', !product.available && 'opacity-80')}>
                <div className="flex min-w-0 items-center gap-3">
                  <img src={product.image} alt={product.name} className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-gray-100" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{product.name}</p>
                      {product.featured ? (
                        <Badge variant="secondary" className={cn(PANEL_BADGE, 'text-[10px]')}>
                          Destacado
                        </Badge>
                      ) : null}
                      {!product.available ? (
                        <Badge variant="secondary" className={cn(PANEL_MUTED_BADGE, 'text-[10px]')}>
                          Oculto
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {categoryNameById[product.categoryId] ?? 'Sin categoría'} · {formatPrice(product.price)} ·{' '}
                      {product.preparationTime} min
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 self-end sm:self-auto">
                  <Button variant="outline" size="sm" className={PANEL_OUTLINE_BTN} onClick={() => loadProduct(product)}>Editar</Button>
                  <Button variant="destructive" size="sm" onClick={() => admin.deleteProduct(product.id).then(() => toast.success('Producto eliminado'))}>Eliminar</Button>
                </div>
              </div>
              ))
            )}

            {filteredProducts.length > PRODUCTS_PAGE_SIZE ? (
              <div className={cn('flex items-center justify-between border-t pt-4', PANEL_BORDER)}>
                <p className="text-xs text-muted-foreground">
                  Página {page + 1} de {pageCount}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={PANEL_OUTLINE_BTN}
                    disabled={page === 0}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={PANEL_OUTLINE_BTN}
                    disabled={page >= pageCount - 1}
                    onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
    </div>
  )
}
