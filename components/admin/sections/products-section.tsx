'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { formatPrice } from '@/lib/coty-theme'
import { PANEL_CARD, PANEL_LIST_ROW, PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN, PANEL_TITLE, PANEL_TOGGLE_ROW } from '@/lib/panel-theme'
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

export function ProductsSection() {
  const admin = useAdminData()
  const { open, setOpen, openPanel } = useFormPanel('products')
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm)

  const productCategoryOptions = useMemo(
    () => admin.categories.map((category) => ({ value: category.id, label: category.name })),
    [admin.categories]
  )

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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el producto')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <AdminPageHeader
        title="Productos"
        description="Gestioná el menú y sus opciones"
        onNew={() => {
          setProductForm(emptyProductForm())
          openPanel()
        }}
      />
      <div className="space-y-6">
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
            <Button className={cn('flex-1', PANEL_PRIMARY_BTN)} onClick={() => void submitProduct()}>Guardar</Button>
            <Button variant="outline" className={PANEL_OUTLINE_BTN} onClick={() => setProductForm(emptyProductForm())}>Limpiar</Button>
          </div>
        </AdminFormPanel>

        <Card className={PANEL_CARD}>
          <CardHeader>
            <CardTitle className={PANEL_TITLE}>Listado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {admin.products.map((product) => (
              <div key={product.id} className={cn(PANEL_LIST_ROW, 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between')}>
                <div className="flex min-w-0 items-center gap-3">
                  <img src={product.image} alt={product.name} className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-gray-100" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{formatPrice(product.price)} · {product.preparationTime} min</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 self-end sm:self-auto">
                  <Button variant="outline" size="sm" className={PANEL_OUTLINE_BTN} onClick={() => loadProduct(product)}>Editar</Button>
                  <Button variant="destructive" size="sm" onClick={() => void admin.deleteProduct(product.id).then(() => toast.success('Producto eliminado'))}>Eliminar</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
