'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { formatCategoryIconLabel, getCategoryIcon } from '@/lib/category-icons'
import { PANEL_CARD, PANEL_ICON_ACTIVE, PANEL_LIST_ROW, PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN, PANEL_SURFACE, PANEL_TITLE, PANEL_TOGGLE_ROW } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import { useAdminData } from '@/lib/store'
import type { Category } from '@/lib/types'
import { CategoryIconPicker } from '@/components/admin/forms/category-icon-picker'
import { useFormPanel } from '../hooks/use-form-panel'
import { emptyCategoryForm } from '../types'
import type { CategoryFormState } from '../types'
import { AdminFormPanel } from '../ui/admin-form-panel'
import { AdminPageHeader } from '../ui/admin-page-header'
import { Field } from '../ui/field'

export function CategoriesSection() {
  const admin = useAdminData()
  const { open, setOpen, openPanel } = useFormPanel('categories')
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm)

  const loadCategory = (category: Category) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      icon: category.icon,
      order: category.order,
      active: category.active ?? true,
    })
    openPanel()
  }

  const submitCategory = async () => {
    try {
      const payload = {
        name: categoryForm.name,
        icon: categoryForm.icon,
        order: categoryForm.order,
        active: categoryForm.active,
      }

      if (categoryForm.id) {
        await admin.updateCategory(categoryForm.id, payload)
        toast.success('Categoría actualizada')
      } else {
        await admin.addCategory(payload)
        toast.success('Categoría creada')
      }

      setCategoryForm(emptyCategoryForm())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la categoría')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <AdminPageHeader
        title="Categorías"
        description="Organizá las secciones del menú"
        onNew={() => {
          setCategoryForm(emptyCategoryForm())
          openPanel()
        }}
      />
      <div className="space-y-6">
        <AdminFormPanel
          panelId="categories"
          title={categoryForm.id ? 'Editar categoría' : 'Nueva categoría'}
          open={open}
          onOpenChange={setOpen}
        >
          <Field label="Nombre">
            <Input value={categoryForm.name} onChange={(event) => setCategoryForm((previous) => ({ ...previous, name: event.target.value }))} />
          </Field>
          <Field label="Icono">
            <CategoryIconPicker
              value={categoryForm.icon}
              onChange={(icon) => setCategoryForm((previous) => ({ ...previous, icon }))}
            />
          </Field>
          <Field label="Orden">
            <Input type="number" value={categoryForm.order} onChange={(event) => setCategoryForm((previous) => ({ ...previous, order: Number(event.target.value) }))} />
          </Field>
          <div className={PANEL_TOGGLE_ROW}>
            <Label>Activa</Label>
            <Switch checked={categoryForm.active} onCheckedChange={(checked) => setCategoryForm((previous) => ({ ...previous, active: checked }))} />
          </div>
          <div className="flex gap-2">
            <Button className={cn('flex-1', PANEL_PRIMARY_BTN)} onClick={() => submitCategory()}>Guardar</Button>
            <Button variant="outline" className={PANEL_OUTLINE_BTN} onClick={() => setCategoryForm(emptyCategoryForm())}>Limpiar</Button>
          </div>
        </AdminFormPanel>

        <Card className={PANEL_CARD}>
          <CardHeader><CardTitle className={PANEL_TITLE}>Listado</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {admin.categories.map((category) => {
              const CategoryIcon = getCategoryIcon(category.icon)
              return (
                <div key={category.id} className={cn(PANEL_LIST_ROW, 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between')}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', PANEL_SURFACE)}>
                      <CategoryIcon className={cn('h-5 w-5', PANEL_ICON_ACTIVE)} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{category.name}</p>
                      <p className="truncate text-xs capitalize text-muted-foreground">
                        {formatCategoryIconLabel(category.icon)} · orden {category.order}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2 self-end sm:self-auto">
                    <Button variant="outline" size="sm" className={PANEL_OUTLINE_BTN} onClick={() => loadCategory(category)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => admin.deleteCategory(category.id).then(() => toast.success('Categoría eliminada'))}>Eliminar</Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
