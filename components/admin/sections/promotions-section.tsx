'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PANEL_CARD, PANEL_LIST_ROW, PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN, PANEL_TITLE, PANEL_TOGGLE_ROW } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import { useAdminData } from '@/lib/store'
import type { Promotion } from '@/lib/types'
import { ImageUploadField } from '@/components/admin/forms/image-upload-field'
import { MultiSelectField } from '@/components/admin/forms/multi-select-field'
import { useFormPanel } from '../hooks/use-form-panel'
import { emptyPromotionForm } from '../types'
import type { PromotionFormState } from '../types'
import { AdminFormPanel } from '../ui/admin-form-panel'
import { AdminPageHeader } from '../ui/admin-page-header'
import { Field } from '../ui/field'

export function PromotionsSection() {
  const admin = useAdminData()
  const { open, setOpen, openPanel } = useFormPanel('promotions')
  const [promotionForm, setPromotionForm] = useState<PromotionFormState>(emptyPromotionForm)

  const promotionProductOptions = useMemo(
    () =>
      admin.products.map((product) => ({
        value: product.id,
        label: product.name,
        description: admin.categories.find((category) => category.id === product.categoryId)?.name,
      })),
    [admin.products, admin.categories]
  )

  const promotionCategoryOptions = useMemo(
    () => admin.categories.map((category) => ({ value: category.id, label: category.name })),
    [admin.categories]
  )

  const loadPromotion = (promotion: Promotion) => {
    setPromotionForm({
      id: promotion.id,
      title: promotion.title,
      description: promotion.description,
      image: promotion.image,
      discount: promotion.discount,
      validFrom: promotion.validFrom.toISOString().slice(0, 10),
      validTo: promotion.validTo.toISOString().slice(0, 10),
      productIds: promotion.productIds ?? [],
      categoryIds: promotion.categoryIds ?? [],
      active: promotion.active,
    })
    openPanel()
  }

  const submitPromotion = async () => {
    try {
      const payload = {
        title: promotionForm.title,
        description: promotionForm.description,
        image: promotionForm.image,
        discount: promotionForm.discount,
        validFrom: promotionForm.validFrom,
        validTo: promotionForm.validTo,
        productIds: promotionForm.productIds,
        categoryIds: promotionForm.categoryIds,
        active: promotionForm.active,
      }

      if (promotionForm.id) {
        await admin.updatePromotion(promotionForm.id, payload)
        toast.success('Promoción actualizada')
      } else {
        await admin.addPromotion(payload)
        toast.success('Promoción creada')
      }

      setPromotionForm(emptyPromotionForm())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la promoción')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <AdminPageHeader
        title="Promociones"
        description="Descuentos y ofertas activas"
        onNew={() => {
          setPromotionForm(emptyPromotionForm())
          openPanel()
        }}
      />
      <div className="space-y-6">
        <AdminFormPanel
          panelId="promotions"
          title={promotionForm.id ? 'Editar promoción' : 'Nueva promoción'}
          open={open}
          onOpenChange={setOpen}
        >
          <Field label="Título"><Input value={promotionForm.title} onChange={(event) => setPromotionForm((previous) => ({ ...previous, title: event.target.value }))} /></Field>
          <Field label="Descripción"><Textarea value={promotionForm.description} onChange={(event) => setPromotionForm((previous) => ({ ...previous, description: event.target.value }))} /></Field>
          <Field label="Imagen">
            <ImageUploadField
              folder="promotions"
              value={promotionForm.image}
              onChange={(url) => setPromotionForm((previous) => ({ ...previous, image: url }))}
            />
          </Field>
          <Field label="Descuento (%)"><Input type="number" value={promotionForm.discount} onChange={(event) => setPromotionForm((previous) => ({ ...previous, discount: Number(event.target.value) }))} /></Field>
          <Field label="Válida desde"><Input type="date" value={promotionForm.validFrom} onChange={(event) => setPromotionForm((previous) => ({ ...previous, validFrom: event.target.value }))} /></Field>
          <Field label="Válida hasta"><Input type="date" value={promotionForm.validTo} onChange={(event) => setPromotionForm((previous) => ({ ...previous, validTo: event.target.value }))} /></Field>
          <Field label="Productos">
            <MultiSelectField
              options={promotionProductOptions}
              value={promotionForm.productIds}
              onChange={(productIds) => setPromotionForm((previous) => ({ ...previous, productIds }))}
              placeholder="Elegir productos"
              searchPlaceholder="Buscar producto..."
              emptyMessage="No hay productos"
            />
          </Field>
          <Field label="Categorías">
            <MultiSelectField
              options={promotionCategoryOptions}
              value={promotionForm.categoryIds}
              onChange={(categoryIds) => setPromotionForm((previous) => ({ ...previous, categoryIds }))}
              placeholder="Elegir categorías"
              searchPlaceholder="Buscar categoría..."
              emptyMessage="No hay categorías"
            />
          </Field>
          <div className={PANEL_TOGGLE_ROW}>
            <Label>Activa</Label>
            <Switch checked={promotionForm.active} onCheckedChange={(checked) => setPromotionForm((previous) => ({ ...previous, active: checked }))} />
          </div>
          <div className="flex gap-2">
            <Button className={cn('flex-1', PANEL_PRIMARY_BTN)} onClick={() => void submitPromotion()}>Guardar</Button>
            <Button variant="outline" className={PANEL_OUTLINE_BTN} onClick={() => setPromotionForm(emptyPromotionForm())}>Limpiar</Button>
          </div>
        </AdminFormPanel>

        <Card className={PANEL_CARD}>
          <CardHeader><CardTitle className={PANEL_TITLE}>Listado</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {admin.promotions.map((promotion) => (
              <div key={promotion.id} className={cn(PANEL_LIST_ROW, 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between')}>
                <div className="min-w-0">
                  <p className="truncate font-medium">{promotion.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{promotion.discount}% · hasta {format(promotion.validTo, 'dd/MM/yyyy', { locale: es })}</p>
                </div>
                <div className="flex shrink-0 gap-2 self-end sm:self-auto">
                  <Button variant="outline" size="sm" className={PANEL_OUTLINE_BTN} onClick={() => loadPromotion(promotion)}>Editar</Button>
                  <Button variant="destructive" size="sm" onClick={() => void admin.deletePromotion(promotion.id).then(() => toast.success('Promoción eliminada'))}>Eliminar</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
