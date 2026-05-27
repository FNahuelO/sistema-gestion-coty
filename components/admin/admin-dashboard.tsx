'use client'

import { useEffect, useMemo, useState, type ElementType, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  BarChart3,
  Coffee,
  DollarSign,
  LayoutGrid,
  LogOut,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAdminData, useAuth } from '@/lib/store'
import type { Category, Product, Promotion, Table, TableStatus, User } from '@/lib/types'
import { StatusBadge } from '@/components/shared/status-badge'

type ProductFormState = {
  id?: string
  name: string
  description: string
  price: number
  image: string
  categoryId: string
  featured: boolean
  available: boolean
  preparationTime: number
  optionsText: string
}

type CategoryFormState = {
  id?: string
  name: string
  icon: string
  order: number
  active: boolean
}

type PromotionFormState = {
  id?: string
  title: string
  description: string
  image: string
  discount: number
  validFrom: string
  validTo: string
  productIdsText: string
  categoryIdsText: string
  active: boolean
}

type TableFormState = {
  id?: string
  number: number
  capacity: number
  status: TableStatus
  active: boolean
}

type UserFormState = {
  id?: string
  name: string
  email: string
  role: User['role']
  avatar: string
  active: boolean
  password: string
}

const emptyProductForm = (): ProductFormState => ({
  name: '',
  description: '',
  price: 0,
  image: '',
  categoryId: '',
  featured: false,
  available: true,
  preparationTime: 0,
  optionsText: '[]',
})

const emptyCategoryForm = (): CategoryFormState => ({
  name: '',
  icon: 'Coffee',
  order: 0,
  active: true,
})

const emptyPromotionForm = (): PromotionFormState => ({
  title: '',
  description: '',
  image: '',
  discount: 0,
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: new Date().toISOString().slice(0, 10),
  productIdsText: '',
  categoryIdsText: '',
  active: true,
})

const emptyTableForm = (): TableFormState => ({
  number: 1,
  capacity: 2,
  status: 'free',
  active: true,
})

const emptyUserForm = (): UserFormState => ({
  name: '',
  email: '',
  role: 'waitress',
  avatar: '',
  active: true,
  password: '',
})

function parseIds(text: string) {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseOptions(text: string) {
  if (!text.trim()) return []
  return JSON.parse(text)
}

export function AdminDashboard() {
  const router = useRouter()
  const { logout } = useAuth()
  const admin = useAdminData()
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm)
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm)
  const [promotionForm, setPromotionForm] = useState<PromotionFormState>(emptyPromotionForm)
  const [tableForm, setTableForm] = useState<TableFormState>(emptyTableForm)
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm)
  const [settingsDraft, setSettingsDraft] = useState(admin.settings)

  useEffect(() => {
    setSettingsDraft(admin.settings)
  }, [admin.settings])

  const productCategoryOptions = useMemo(
    () => admin.categories.map((category) => ({ value: category.id, label: category.name })),
    [admin.categories]
  )

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

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
      optionsText: JSON.stringify(product.options ?? [], null, 2),
    })
  }

  const loadCategory = (category: Category) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      icon: category.icon,
      order: category.order,
      active: category.active ?? true,
    })
  }

  const loadPromotion = (promotion: Promotion) => {
    setPromotionForm({
      id: promotion.id,
      title: promotion.title,
      description: promotion.description,
      image: promotion.image,
      discount: promotion.discount,
      validFrom: promotion.validFrom.toISOString().slice(0, 10),
      validTo: promotion.validTo.toISOString().slice(0, 10),
      productIdsText: (promotion.productIds ?? []).join(', '),
      categoryIdsText: (promotion.categoryIds ?? []).join(', '),
      active: promotion.active,
    })
  }

  const loadTable = (table: Table) => {
    setTableForm({
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      status: table.status,
      active: table.active ?? true,
    })
  }

  const loadUser = (user: User) => {
    setUserForm({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar ?? '',
      active: user.active ?? true,
      password: '',
    })
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
        options: parseOptions(productForm.optionsText),
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

  const submitPromotion = async () => {
    try {
      const payload = {
        title: promotionForm.title,
        description: promotionForm.description,
        image: promotionForm.image,
        discount: promotionForm.discount,
        validFrom: promotionForm.validFrom,
        validTo: promotionForm.validTo,
        productIds: parseIds(promotionForm.productIdsText),
        categoryIds: parseIds(promotionForm.categoryIdsText),
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

  const submitTable = async () => {
    try {
      const payload = {
        number: tableForm.number,
        capacity: tableForm.capacity,
        status: tableForm.status,
        active: tableForm.active,
      }

      if (tableForm.id) {
        await admin.updateTable(tableForm.id, payload)
        toast.success('Mesa actualizada')
      } else {
        await admin.addTable(payload)
        toast.success('Mesa creada')
      }

      setTableForm(emptyTableForm())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la mesa')
    }
  }

  const submitUser = async () => {
    try {
      const payload = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        avatar: userForm.avatar,
        active: userForm.active,
        ...(userForm.password ? { password: userForm.password } : {}),
      }

      if (userForm.id) {
        await admin.updateUser(userForm.id, payload)
        toast.success('Usuario actualizado')
      } else {
        await admin.addUser(payload)
        toast.success('Usuario creado')
      }

      setUserForm(emptyUserForm())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el usuario')
    }
  }

  const saveSettings = async () => {
    if (!settingsDraft) return
    try {
      await admin.updateSettings(settingsDraft)
      toast.success('Configuración actualizada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la configuración')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Coffee className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold">Coty Café</p>
              <p className="text-sm text-muted-foreground">Panel administrador</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="container px-4 py-6 mx-auto">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tag className="h-4 w-4" />
              Categorías
            </TabsTrigger>
            <TabsTrigger value="promotions" className="gap-2">
              <Percent className="h-4 w-4" />
              Promociones
            </TabsTrigger>
            <TabsTrigger value="tables" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Mesas
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Ventas de hoy" value={`$${admin.analytics?.todayRevenue.toFixed(2) ?? '0.00'}`} icon={DollarSign} />
              <MetricCard title="Pedidos de hoy" value={String(admin.analytics?.todayOrders ?? 0)} icon={ShoppingCart} />
              <MetricCard title="Ticket promedio" value={`$${admin.analytics?.averageTicket.toFixed(2) ?? '0.00'}`} icon={BarChart3} />
              <MetricCard title="Pedidos activos" value={String(admin.analytics?.activeOrders ?? 0)} icon={Package} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por tipo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <BreakdownRow label="Delivery" value={admin.analytics?.salesByType.delivery ?? 0} icon={<Truck className="h-4 w-4" />} />
                  <BreakdownRow label="Retiro" value={admin.analytics?.salesByType.pickup ?? 0} icon={<Store className="h-4 w-4" />} />
                  <BreakdownRow label="Mesas" value={admin.analytics?.salesByType.table ?? 0} icon={<Users className="h-4 w-4" />} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Productos más vendidos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(admin.analytics?.topProducts ?? []).map((product) => (
                    <div key={product.productId} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-muted-foreground">{product.quantity} unidades</p>
                      </div>
                      <Badge variant="secondary">${product.revenue.toFixed(2)}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Historial reciente</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(admin.exportSalesUrl('csv'), '_blank')}>
                    Exportar CSV
                  </Button>
                  <Button size="sm" onClick={() => window.open(admin.exportSalesUrl('xlsx'), '_blank')}>
                    Exportar Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {admin.history.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{order.displayCode ?? order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customerName} • {order.type} • {format(order.createdAt, 'dd/MM/yyyy HH:mm', { locale: es })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      <Badge variant="outline">${order.total.toFixed(2)}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Productos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {admin.products.map((product) => (
                  <div key={product.id} className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt={product.name} className="h-14 w-14 rounded-lg object-cover" />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">${product.price.toFixed(2)} • {product.preparationTime} min</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => loadProduct(product)}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => void admin.deleteProduct(product.id).then(() => toast.success('Producto eliminado'))}>Eliminar</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{productForm.id ? 'Editar producto' : 'Nuevo producto'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field label="Nombre"><Input value={productForm.name} onChange={(event) => setProductForm((previous) => ({ ...previous, name: event.target.value }))} /></Field>
                <Field label="Descripción"><Textarea value={productForm.description} onChange={(event) => setProductForm((previous) => ({ ...previous, description: event.target.value }))} /></Field>
                <Field label="Imagen (URL)"><Input value={productForm.image} onChange={(event) => setProductForm((previous) => ({ ...previous, image: event.target.value }))} /></Field>
                <Field label="Precio"><Input type="number" value={productForm.price} onChange={(event) => setProductForm((previous) => ({ ...previous, price: Number(event.target.value) }))} /></Field>
                <Field label="Tiempo de preparación (min)"><Input type="number" value={productForm.preparationTime} onChange={(event) => setProductForm((previous) => ({ ...previous, preparationTime: Number(event.target.value) }))} /></Field>
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
                <Field label="Opciones del producto (JSON)">
                  <Textarea rows={8} value={productForm.optionsText} onChange={(event) => setProductForm((previous) => ({ ...previous, optionsText: event.target.value }))} />
                </Field>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>Destacado</Label>
                  <Switch checked={productForm.featured} onCheckedChange={(checked) => setProductForm((previous) => ({ ...previous, featured: checked }))} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>Disponible</Label>
                  <Switch checked={productForm.available} onCheckedChange={(checked) => setProductForm((previous) => ({ ...previous, available: checked }))} />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => void submitProduct()}>Guardar</Button>
                  <Button variant="outline" onClick={() => setProductForm(emptyProductForm())}>Limpiar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <Card>
              <CardHeader><CardTitle>Categorías</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {admin.categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">{category.icon} • orden {category.order}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => loadCategory(category)}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => void admin.deleteCategory(category.id).then(() => toast.success('Categoría eliminada'))}>Eliminar</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{categoryForm.id ? 'Editar categoría' : 'Nueva categoría'}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Field label="Nombre"><Input value={categoryForm.name} onChange={(event) => setCategoryForm((previous) => ({ ...previous, name: event.target.value }))} /></Field>
                <Field label="Icono"><Input value={categoryForm.icon} onChange={(event) => setCategoryForm((previous) => ({ ...previous, icon: event.target.value }))} /></Field>
                <Field label="Orden"><Input type="number" value={categoryForm.order} onChange={(event) => setCategoryForm((previous) => ({ ...previous, order: Number(event.target.value) }))} /></Field>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>Activa</Label>
                  <Switch checked={categoryForm.active} onCheckedChange={(checked) => setCategoryForm((previous) => ({ ...previous, active: checked }))} />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => void submitCategory()}>Guardar</Button>
                  <Button variant="outline" onClick={() => setCategoryForm(emptyCategoryForm())}>Limpiar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promotions" className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <Card>
              <CardHeader><CardTitle>Promociones</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {admin.promotions.map((promotion) => (
                  <div key={promotion.id} className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{promotion.title}</p>
                      <p className="text-sm text-muted-foreground">{promotion.discount}% • hasta {format(promotion.validTo, 'dd/MM/yyyy', { locale: es })}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => loadPromotion(promotion)}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => void admin.deletePromotion(promotion.id).then(() => toast.success('Promoción eliminada'))}>Eliminar</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{promotionForm.id ? 'Editar promoción' : 'Nueva promoción'}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Field label="Título"><Input value={promotionForm.title} onChange={(event) => setPromotionForm((previous) => ({ ...previous, title: event.target.value }))} /></Field>
                <Field label="Descripción"><Textarea value={promotionForm.description} onChange={(event) => setPromotionForm((previous) => ({ ...previous, description: event.target.value }))} /></Field>
                <Field label="Imagen (URL)"><Input value={promotionForm.image} onChange={(event) => setPromotionForm((previous) => ({ ...previous, image: event.target.value }))} /></Field>
                <Field label="Descuento (%)"><Input type="number" value={promotionForm.discount} onChange={(event) => setPromotionForm((previous) => ({ ...previous, discount: Number(event.target.value) }))} /></Field>
                <Field label="Válida desde"><Input type="date" value={promotionForm.validFrom} onChange={(event) => setPromotionForm((previous) => ({ ...previous, validFrom: event.target.value }))} /></Field>
                <Field label="Válida hasta"><Input type="date" value={promotionForm.validTo} onChange={(event) => setPromotionForm((previous) => ({ ...previous, validTo: event.target.value }))} /></Field>
                <Field label="IDs de productos (coma separada)"><Input value={promotionForm.productIdsText} onChange={(event) => setPromotionForm((previous) => ({ ...previous, productIdsText: event.target.value }))} /></Field>
                <Field label="IDs de categorías (coma separada)"><Input value={promotionForm.categoryIdsText} onChange={(event) => setPromotionForm((previous) => ({ ...previous, categoryIdsText: event.target.value }))} /></Field>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>Activa</Label>
                  <Switch checked={promotionForm.active} onCheckedChange={(checked) => setPromotionForm((previous) => ({ ...previous, active: checked }))} />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => void submitPromotion()}>Guardar</Button>
                  <Button variant="outline" onClick={() => setPromotionForm(emptyPromotionForm())}>Limpiar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables" className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <Card>
              <CardHeader><CardTitle>Mesas</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {admin.tables.map((table) => (
                  <div key={table.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-serif text-2xl font-bold">Mesa {table.number}</p>
                      <StatusBadge status={table.status} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{table.capacity} personas</p>
                    <p className="text-sm text-muted-foreground">Total actual: ${table.currentTotal?.toFixed(2) ?? '0.00'}</p>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => loadTable(table)}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => void admin.deleteTable(table.id).then(() => toast.success('Mesa desactivada'))}>Eliminar</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{tableForm.id ? 'Editar mesa' : 'Nueva mesa'}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Field label="Número"><Input type="number" value={tableForm.number} onChange={(event) => setTableForm((previous) => ({ ...previous, number: Number(event.target.value) }))} /></Field>
                <Field label="Capacidad"><Input type="number" value={tableForm.capacity} onChange={(event) => setTableForm((previous) => ({ ...previous, capacity: Number(event.target.value) }))} /></Field>
                <Field label="Estado">
                  <Select value={tableForm.status} onValueChange={(value) => setTableForm((previous) => ({ ...previous, status: value as TableStatus }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Libre</SelectItem>
                      <SelectItem value="occupied">Ocupada</SelectItem>
                      <SelectItem value="waiting">Esperando pedido</SelectItem>
                      <SelectItem value="finished">Finalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>Activa</Label>
                  <Switch checked={tableForm.active} onCheckedChange={(checked) => setTableForm((previous) => ({ ...previous, active: checked }))} />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => void submitTable()}>Guardar</Button>
                  <Button variant="outline" onClick={() => setTableForm(emptyTableForm())}>Limpiar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <Card>
              <CardHeader><CardTitle>Usuarios del sistema</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {admin.users.map((user) => (
                  <div key={user.id} className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline">{user.role}</Badge>
                        <Badge variant={user.active ? 'secondary' : 'destructive'}>
                          {user.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => loadUser(user)}>Editar</Button>
                      {user.active ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void admin.deleteUser(user.id).then(() => toast.success('Usuario desactivado'))}
                        >
                          Desactivar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() =>
                            void admin.updateUser(user.id, {
                              name: user.name,
                              email: user.email,
                              role: user.role,
                              avatar: user.avatar ?? '',
                              active: true,
                            }).then(() => toast.success('Usuario reactivado'))
                          }
                        >
                          Reactivar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{userForm.id ? 'Editar usuario' : 'Nuevo usuario'}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Field label="Nombre">
                  <Input value={userForm.name} onChange={(event) => setUserForm((previous) => ({ ...previous, name: event.target.value }))} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={userForm.email} onChange={(event) => setUserForm((previous) => ({ ...previous, email: event.target.value }))} />
                </Field>
                <Field label="Rol">
                  <Select value={userForm.role} onValueChange={(value) => setUserForm((previous) => ({ ...previous, role: value as User['role'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="cashier">Caja</SelectItem>
                      <SelectItem value="waitress">Mesero/a</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Avatar (URL opcional)">
                  <Input value={userForm.avatar} onChange={(event) => setUserForm((previous) => ({ ...previous, avatar: event.target.value }))} />
                </Field>
                <Field label={userForm.id ? 'Nueva contraseña (opcional)' : 'Contraseña'}>
                  <Input
                    type="password"
                    value={userForm.password}
                    onChange={(event) => setUserForm((previous) => ({ ...previous, password: event.target.value }))}
                    placeholder={userForm.id ? 'Dejar vacío para mantener la actual' : 'Mínimo 6 caracteres'}
                  />
                </Field>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>Activo</Label>
                  <Switch checked={userForm.active} onCheckedChange={(checked) => setUserForm((previous) => ({ ...previous, active: checked }))} />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => void submitUser()}>Guardar</Button>
                  <Button variant="outline" onClick={() => setUserForm(emptyUserForm())}>Limpiar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <CardHeader><CardTitle>Configuración del negocio</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Field label="Nombre"><Input value={settingsDraft?.name ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, name: event.target.value } : previous)} /></Field>
                <Field label="Logo"><Input value={settingsDraft?.logo ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, logo: event.target.value } : previous)} /></Field>
                <Field label="Teléfono"><Input value={settingsDraft?.phone ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, phone: event.target.value } : previous)} /></Field>
                <Field label="Dirección"><Textarea value={settingsDraft?.address ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, address: event.target.value } : previous)} /></Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Hora apertura"><Input value={settingsDraft?.openTime ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, openTime: event.target.value } : previous)} /></Field>
                  <Field label="Hora cierre"><Input value={settingsDraft?.closeTime ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, closeTime: event.target.value } : previous)} /></Field>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Delivery fee"><Input type="number" value={settingsDraft?.deliveryFee ?? 0} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, deliveryFee: Number(event.target.value) } : previous)} /></Field>
                  <Field label="Pedido mínimo"><Input type="number" value={settingsDraft?.minOrderAmount ?? 0} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, minOrderAmount: Number(event.target.value) } : previous)} /></Field>
                </div>
                <Field label="Tasa impositiva"><Input type="number" step="0.01" value={settingsDraft?.taxRate ?? 0} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, taxRate: Number(event.target.value) } : previous)} /></Field>
                <Field label="WhatsApp"><Input value={settingsDraft?.whatsapp ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, whatsapp: event.target.value } : previous)} /></Field>
                <Field label="Instagram"><Input value={settingsDraft?.instagram ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, instagram: event.target.value } : previous)} /></Field>
                <Field label="Facebook"><Input value={settingsDraft?.facebook ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, facebook: event.target.value } : previous)} /></Field>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>Negocio abierto</Label>
                  <Switch checked={settingsDraft?.isOpen ?? false} onCheckedChange={(checked) => setSettingsDraft((previous) => previous ? { ...previous, isOpen: checked } : previous)} />
                </div>
                <Button className="w-full" onClick={() => void saveSettings()}>Guardar configuración</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Control operativo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <MetricCard title="Mesas atendidas" value={String(admin.analytics?.tablesServed ?? 0)} icon={LayoutGrid} />
                  <MetricCard title="Productos activos" value={String(admin.products.filter((product) => product.available).length)} icon={Package} />
                </div>
                <div className="rounded-lg border p-4">
                  <p className="font-medium">Pedidos recientes</p>
                  <div className="mt-3 space-y-2">
                    {admin.orders.slice(0, 6).map((order) => (
                      <div key={order.id} className="flex items-center justify-between text-sm">
                        <span>{order.displayCode ?? order.id} • {order.customerName}</span>
                        <span className="font-medium">${order.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => window.open(admin.exportSalesUrl('csv'), '_blank')}>
                    Exportar CSV
                  </Button>
                  <Button className="flex-1" onClick={() => window.open(admin.exportSalesUrl('xlsx'), '_blank')}>
                    Exportar XLSX
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: string
  icon: ElementType
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </CardContent>
    </Card>
  )
}

function BreakdownRow({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: ReactNode
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
      <Badge variant="outline">${value.toFixed(2)}</Badge>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
