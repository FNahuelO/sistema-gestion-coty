'use client'

import { useCallback, useEffect, useMemo, useState, type ElementType, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  BarChart3,
  ChevronDown,
  Coffee,
  DollarSign,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Percent,
  Plus,
  Settings,
  ShoppingCart,
  Store,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { formatCategoryIconLabel, getCategoryIcon } from '@/lib/category-icons'
import { COTY_HEADER, COTY_QTY_BG, COTY_TEAL, formatPrice } from '@/lib/coty-theme'
import { cn } from '@/lib/utils'
import { useAdminData, useAuth } from '@/lib/store'
import type { Category, Order, OrderType, Product, ProductOption, Promotion, Table, TableStatus, User } from '@/lib/types'
import { StatusBadge } from '@/components/shared/status-badge'
import { SalesChart } from '@/components/admin/sales-chart'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { CategoryIconPicker } from '@/components/admin/category-icon-picker'
import { MultiSelectField } from '@/components/admin/multi-select-field'
import { ProductOptionsEditor, normalizeProductOptions } from '@/components/admin/product-options-editor'
import { MenuQrSection } from '@/components/admin/menu-qr-section'
import { TableQrButton, TableQrDialog } from '@/components/admin/table-qr-dialog'

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
  options: ProductOption[]
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
  productIds: string[]
  categoryIds: string[]
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
  options: [],
})

const emptyCategoryForm = (): CategoryFormState => ({
  name: '',
  icon: 'coffee',
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
  productIds: [],
  categoryIds: [],
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
  role: 'staff',
  avatar: '',
  active: true,
  password: '',
})

type AdminSection =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'promotions'
  | 'tables'
  | 'users'
  | 'settings'

const NAV_ITEMS: { id: AdminSection; label: string; icon: ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'categories', label: 'Categorías', icon: LayoutGrid },
  { id: 'promotions', label: 'Promociones', icon: Percent },
  { id: 'tables', label: 'Mesas', icon: Store },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'settings', label: 'Configuración', icon: Settings },
]

const ADMIN_CARD = 'rounded-2xl border border-gray-100 bg-white shadow-sm'
const ADMIN_LIST_ROW = 'rounded-xl border border-gray-100 bg-white p-3 shadow-sm'
const ADMIN_TOGGLE_ROW = 'flex items-center justify-between rounded-xl border border-gray-100 bg-[#F8FBFA] p-3'
const ADMIN_TITLE = 'text-sm font-semibold text-[#2D5A57]'
const ADMIN_PRIMARY_BTN = 'bg-[#2D5A57] text-white hover:bg-[#053E38]'
const ADMIN_OUTLINE_BTN = 'border-[#C5DDD9] bg-white text-[#2D5A57] hover:bg-[#C5DDD9]/40'

type FormSection = Exclude<AdminSection, 'dashboard'>

const DEFAULT_FORM_PANELS: Record<FormSection, boolean> = {
  products: false,
  categories: false,
  promotions: false,
  tables: false,
  users: false,
  settings: false,
}

const ORDER_TYPE_META: Record<OrderType, { label: string; accent: string; icon: ElementType }> = {
  delivery: { label: 'Delivery', accent: 'border-l-[#E8A598]', icon: Truck },
  pickup: { label: 'Retiro', accent: 'border-l-[#7EB8B3]', icon: Store },
  table: { label: 'Mesa', accent: 'border-l-[#7EB8B3]', icon: Users },
}

function percentVsYesterday(today: number, yesterday: number) {
  if (yesterday === 0) return null
  return ((today - yesterday) / yesterday) * 100
}

function yesterdayMetrics(dailySales: { date: string; revenue: number; orders: number }[]) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const key = yesterday.toISOString().slice(0, 10)
  const entry = dailySales.find((day) => day.date === key)
  return {
    revenue: entry?.revenue ?? 0,
    orders: entry?.orders ?? 0,
  }
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
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [formPanelsOpen, setFormPanelsOpen] = useState(DEFAULT_FORM_PANELS)
  const [qrTable, setQrTable] = useState<Table | null>(null)

  const setFormPanelOpen = (section: FormSection, open: boolean) => {
    setFormPanelsOpen((previous) => ({ ...previous, [section]: open }))
  }

  const openFormPanel = useCallback((section: FormSection) => {
    setFormPanelsOpen((previous) => ({ ...previous, [section]: true }))
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        document.getElementById(`admin-form-panel-${section}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 120)
    })
  }, [])

  useEffect(() => {
    setSettingsDraft(admin.settings)
  }, [admin.settings])

  const yesterday = useMemo(
    () => yesterdayMetrics(admin.analytics?.dailySales ?? []),
    [admin.analytics?.dailySales]
  )

  const revenueComparison = useMemo(
    () => percentVsYesterday(admin.analytics?.todayRevenue ?? 0, yesterday.revenue),
    [admin.analytics?.todayRevenue, yesterday.revenue]
  )

  const ordersComparison = useMemo(
    () => percentVsYesterday(admin.analytics?.todayOrders ?? 0, yesterday.orders),
    [admin.analytics?.todayOrders, yesterday.orders]
  )

  const HISTORY_PAGE_SIZE = 15
  const [historySearch, setHistorySearch] = useState('')
  const [historyPage, setHistoryPage] = useState(0)

  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase()
    if (!query) return admin.history
    return admin.history.filter(
      (order) =>
        order.displayCode?.toLowerCase().includes(query) ||
        order.publicTrackingCode?.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.includes(query)
    )
  }, [admin.history, historySearch])

  const historyPageCount = Math.max(1, Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE))
  const paginatedHistory = filteredHistory.slice(
    historyPage * HISTORY_PAGE_SIZE,
    (historyPage + 1) * HISTORY_PAGE_SIZE
  )

  useEffect(() => {
    setHistoryPage(0)
  }, [historySearch])

  const navigateTo = (section: AdminSection) => {
    setActiveSection(section)
    setMenuOpen(false)
  }

  const productCategoryOptions = useMemo(
    () => admin.categories.map((category) => ({ value: category.id, label: category.name })),
    [admin.categories]
  )

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
      options: (product.options ?? []).map((option) => ({
        ...option,
        choices: option.choices.map((choice) => ({ ...choice })),
      })),
    })
    openFormPanel('products')
  }

  const loadCategory = (category: Category) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      icon: category.icon,
      order: category.order,
      active: category.active ?? true,
    })
    openFormPanel('categories')
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
      productIds: promotion.productIds ?? [],
      categoryIds: promotion.categoryIds ?? [],
      active: promotion.active,
    })
    openFormPanel('promotions')
  }

  const loadTable = (table: Table) => {
    setTableForm({
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      status: table.status,
      active: table.active ?? true,
    })
    openFormPanel('tables')
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
    openFormPanel('users')
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
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <aside className="hidden w-72 shrink-0 border-r border-gray-100 bg-white lg:flex lg:flex-col">
        <AdminSideNav
          activeSection={activeSection}
          onSelect={navigateTo}
          onLogout={() => void handleLogout()}
        />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[85%] max-w-xs gap-0 border-r p-0 [&>button]:hidden">
          <AdminSideNav
            activeSection={activeSection}
            onSelect={navigateTo}
            onLogout={() => void handleLogout()}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-gray-100 bg-white">
          <div className="flex h-14 items-center justify-between px-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-[#2D5A57] hover:bg-[#C5DDD9]/40 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden w-10 lg:block" />

            <div className="flex flex-col items-center">
              <div
                className="mb-0.5 flex h-7 w-7 items-center justify-center rounded-full"
                style={{ backgroundColor: COTY_HEADER }}
              >
                <Coffee className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="font-serif text-base font-bold leading-tight text-foreground">Coty Cafe</p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => void handleLogout()}
              aria-label="Cerrar sesión"
              className="text-[#2D5A57] hover:bg-[#C5DDD9]/40"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-5">
          {activeSection === 'dashboard' && (
            <div className="mx-auto max-w-3xl space-y-6">
              <section>
                <h2 className="mb-3 text-sm font-semibold text-foreground">Resumen de hoy</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricCard
                    title="Ventas de hoy"
                    value={formatPrice(admin.analytics?.todayRevenue ?? 0)}
                    icon={DollarSign}
                    comparison={revenueComparison}
                  />
                  <MetricCard
                    title="Pedidos de hoy"
                    value={String(admin.analytics?.todayOrders ?? 0)}
                    icon={ShoppingCart}
                    comparison={ordersComparison}
                  />
                  <MetricCard
                    title="Ticket promedio"
                    value={formatPrice(admin.analytics?.averageTicket ?? 0)}
                    icon={BarChart3}
                  />
                  <MetricCard
                    title="Pedidos activos"
                    value={String(admin.analytics?.activeOrders ?? 0)}
                    icon={Package}
                  />
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-sm font-semibold text-foreground">Ventas por tipo</h2>
                <div className="space-y-2">
                  <SalesTypeRow
                    label="Delivery"
                    value={admin.analytics?.salesByType.delivery ?? 0}
                    accentClass="border-b-[#E8A598]"
                  />
                  <SalesTypeRow
                    label="Retiro"
                    value={admin.analytics?.salesByType.pickup ?? 0}
                    accentClass="border-b-[#7EB8B3]"
                  />
                  <SalesTypeRow
                    label="Mesas"
                    value={admin.analytics?.salesByType.table ?? 0}
                    accentClass="border-b-[#7EB8B3]"
                  />
                </div>
              </section>

              <Card className={ADMIN_CARD}>
                <CardHeader>
                  <CardTitle className={ADMIN_TITLE}>Ventas diarias (últimos 14 días)</CardTitle>
                </CardHeader>
                <CardContent>
                  <SalesChart data={admin.analytics?.dailySales ?? []} />
                </CardContent>
              </Card>

              <Card className={ADMIN_CARD}>
                <CardHeader>
                  <CardTitle className={ADMIN_TITLE}>Productos más vendidos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(admin.analytics?.topProducts ?? []).map((product) => (
                    <div key={product.productId} className={cn(ADMIN_LIST_ROW, 'flex items-center justify-between gap-2 text-sm')}>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.productName}</p>
                        <p className="text-xs text-muted-foreground">{product.quantity} unidades</p>
                      </div>
                      <CotyPriceBadge>{formatPrice(product.revenue)}</CotyPriceBadge>
                    </div>
                  ))}
                  {(admin.analytics?.topProducts ?? []).length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">Sin datos de productos</p>
                  )}
                </CardContent>
              </Card>

              <section>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Historial de ventas</h2>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      placeholder="Buscar pedido..."
                      value={historySearch}
                      onChange={(event) => setHistorySearch(event.target.value)}
                      className="h-9 w-full border-gray-200 bg-[#F8FBFA] sm:w-48"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className={ADMIN_OUTLINE_BTN}
                      onClick={() => window.open(admin.exportSalesUrl('csv'), '_blank')}
                    >
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      className={ADMIN_PRIMARY_BTN}
                      onClick={() => window.open(admin.exportSalesUrl('xlsx'), '_blank')}
                    >
                      Excel
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {paginatedHistory.map((order) => (
                    <HistoryOrderRow key={order.id} order={order} />
                  ))}
                  {filteredHistory.length === 0 && (
                    <div className={cn(ADMIN_LIST_ROW, 'py-8 text-center text-xs text-muted-foreground')}>
                      {historySearch ? 'No hay pedidos que coincidan con la búsqueda' : 'No hay pedidos en el historial'}
                    </div>
                  )}
                </div>
                {filteredHistory.length > HISTORY_PAGE_SIZE && (
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {filteredHistory.length} pedidos · página {historyPage + 1} de {historyPageCount}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={ADMIN_OUTLINE_BTN}
                        disabled={historyPage === 0}
                        onClick={() => setHistoryPage((page) => Math.max(0, page - 1))}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={ADMIN_OUTLINE_BTN}
                        disabled={historyPage >= historyPageCount - 1}
                        onClick={() => setHistoryPage((page) => Math.min(historyPageCount - 1, page + 1))}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeSection === 'products' && (
            <div className="mx-auto max-w-6xl space-y-4">
            <AdminPageHeader
              title="Productos"
              description="Gestioná el menú y sus opciones"
              onNew={() => {
                setProductForm(emptyProductForm())
                openFormPanel('products')
              }}
            />
            <div className="space-y-6">
            <AdminFormPanel
              panelId="products"
              title={productForm.id ? 'Editar producto' : 'Nuevo producto'}
              open={formPanelsOpen.products}
              onOpenChange={(open) => setFormPanelOpen('products', open)}
            >
                <Field label="Nombre"><Input value={productForm.name} onChange={(event) => setProductForm((previous) => ({ ...previous, name: event.target.value }))} /></Field>
                <Field label="Descripción"><Textarea value={productForm.description} onChange={(event) => setProductForm((previous) => ({ ...previous, description: event.target.value }))} /></Field>
                <Field label="Imagen">
                  <ImageUploadField
                    folder="products"
                    value={productForm.image}
                    onChange={(url) => setProductForm((previous) => ({ ...previous, image: url }))}
                  />
                </Field>
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
                <Field label="Opciones del producto">
                  <ProductOptionsEditor
                    value={productForm.options}
                    onChange={(options) => setProductForm((previous) => ({ ...previous, options }))}
                  />
                </Field>
                <div className={ADMIN_TOGGLE_ROW}>
                  <Label>Destacado</Label>
                  <Switch checked={productForm.featured} onCheckedChange={(checked) => setProductForm((previous) => ({ ...previous, featured: checked }))} />
                </div>
                <div className={ADMIN_TOGGLE_ROW}>
                  <Label>Disponible</Label>
                  <Switch checked={productForm.available} onCheckedChange={(checked) => setProductForm((previous) => ({ ...previous, available: checked }))} />
                </div>
                <div className="flex gap-2">
                  <Button className={cn('flex-1', ADMIN_PRIMARY_BTN)} onClick={() => void submitProduct()}>Guardar</Button>
                  <Button variant="outline" className={ADMIN_OUTLINE_BTN} onClick={() => setProductForm(emptyProductForm())}>Limpiar</Button>
                </div>
            </AdminFormPanel>

            <Card className={ADMIN_CARD}>
              <CardHeader>
                <CardTitle className={ADMIN_TITLE}>Listado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {admin.products.map((product) => (
                  <div key={product.id} className={cn(ADMIN_LIST_ROW, 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between')}>
                    <div className="flex min-w-0 items-center gap-3">
                      <img src={product.image} alt={product.name} className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-gray-100" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{formatPrice(product.price)} · {product.preparationTime} min</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2 self-end sm:self-auto">
                      <Button variant="outline" size="sm" className={ADMIN_OUTLINE_BTN} onClick={() => loadProduct(product)}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => void admin.deleteProduct(product.id).then(() => toast.success('Producto eliminado'))}>Eliminar</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            </div>
            </div>
          )}

          {activeSection === 'categories' && (
            <div className="mx-auto max-w-6xl space-y-4">
            <AdminPageHeader
              title="Categorías"
              description="Organizá las secciones del menú"
              onNew={() => {
                setCategoryForm(emptyCategoryForm())
                openFormPanel('categories')
              }}
            />
            <div className="space-y-6">
            <AdminFormPanel
              panelId="categories"
              title={categoryForm.id ? 'Editar categoría' : 'Nueva categoría'}
              open={formPanelsOpen.categories}
              onOpenChange={(open) => setFormPanelOpen('categories', open)}
            >
                <Field label="Nombre"><Input value={categoryForm.name} onChange={(event) => setCategoryForm((previous) => ({ ...previous, name: event.target.value }))} /></Field>
                <Field label="Icono">
                  <CategoryIconPicker
                    value={categoryForm.icon}
                    onChange={(icon) => setCategoryForm((previous) => ({ ...previous, icon }))}
                  />
                </Field>
                <Field label="Orden"><Input type="number" value={categoryForm.order} onChange={(event) => setCategoryForm((previous) => ({ ...previous, order: Number(event.target.value) }))} /></Field>
                <div className={ADMIN_TOGGLE_ROW}>
                  <Label>Activa</Label>
                  <Switch checked={categoryForm.active} onCheckedChange={(checked) => setCategoryForm((previous) => ({ ...previous, active: checked }))} />
                </div>
                <div className="flex gap-2">
                  <Button className={cn('flex-1', ADMIN_PRIMARY_BTN)} onClick={() => void submitCategory()}>Guardar</Button>
                  <Button variant="outline" className={ADMIN_OUTLINE_BTN} onClick={() => setCategoryForm(emptyCategoryForm())}>Limpiar</Button>
                </div>
            </AdminFormPanel>

            <Card className={ADMIN_CARD}>
              <CardHeader><CardTitle className={ADMIN_TITLE}>Listado</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {admin.categories.map((category) => {
                  const CategoryIcon = getCategoryIcon(category.icon)
                  return (
                  <div key={category.id} className={cn(ADMIN_LIST_ROW, 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between')}>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8FBFA]">
                        <CategoryIcon className="h-5 w-5" style={{ color: COTY_TEAL }} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{category.name}</p>
                        <p className="truncate text-xs capitalize text-muted-foreground">
                          {formatCategoryIconLabel(category.icon)} · orden {category.order}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2 self-end sm:self-auto">
                      <Button variant="outline" size="sm" className={ADMIN_OUTLINE_BTN} onClick={() => loadCategory(category)}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => void admin.deleteCategory(category.id).then(() => toast.success('Categoría eliminada'))}>Eliminar</Button>
                    </div>
                  </div>
                  )
                })}
              </CardContent>
            </Card>
            </div>
            </div>
          )}

          {activeSection === 'promotions' && (
            <div className="mx-auto max-w-6xl space-y-4">
            <AdminPageHeader
              title="Promociones"
              description="Descuentos y ofertas activas"
              onNew={() => {
                setPromotionForm(emptyPromotionForm())
                openFormPanel('promotions')
              }}
            />
            <div className="space-y-6">
            <AdminFormPanel
              panelId="promotions"
              title={promotionForm.id ? 'Editar promoción' : 'Nueva promoción'}
              open={formPanelsOpen.promotions}
              onOpenChange={(open) => setFormPanelOpen('promotions', open)}
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
                <div className={ADMIN_TOGGLE_ROW}>
                  <Label>Activa</Label>
                  <Switch checked={promotionForm.active} onCheckedChange={(checked) => setPromotionForm((previous) => ({ ...previous, active: checked }))} />
                </div>
                <div className="flex gap-2">
                  <Button className={cn('flex-1', ADMIN_PRIMARY_BTN)} onClick={() => void submitPromotion()}>Guardar</Button>
                  <Button variant="outline" className={ADMIN_OUTLINE_BTN} onClick={() => setPromotionForm(emptyPromotionForm())}>Limpiar</Button>
                </div>
            </AdminFormPanel>

            <Card className={ADMIN_CARD}>
              <CardHeader><CardTitle className={ADMIN_TITLE}>Listado</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {admin.promotions.map((promotion) => (
                  <div key={promotion.id} className={cn(ADMIN_LIST_ROW, 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between')}>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{promotion.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{promotion.discount}% · hasta {format(promotion.validTo, 'dd/MM/yyyy', { locale: es })}</p>
                    </div>
                    <div className="flex shrink-0 gap-2 self-end sm:self-auto">
                      <Button variant="outline" size="sm" className={ADMIN_OUTLINE_BTN} onClick={() => loadPromotion(promotion)}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => void admin.deletePromotion(promotion.id).then(() => toast.success('Promoción eliminada'))}>Eliminar</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            </div>
            </div>
          )}

          {activeSection === 'tables' && (
            <div className="mx-auto max-w-6xl space-y-4">
            <AdminPageHeader
              title="Mesas"
              description="Estado y configuración del salón"
              onNew={() => {
                setTableForm(emptyTableForm())
                openFormPanel('tables')
              }}
            />
            <div className="space-y-6">
            <AdminFormPanel
              panelId="tables"
              title={tableForm.id ? 'Editar mesa' : 'Nueva mesa'}
              open={formPanelsOpen.tables}
              onOpenChange={(open) => setFormPanelOpen('tables', open)}
            >
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
                <div className={ADMIN_TOGGLE_ROW}>
                  <Label>Activa</Label>
                  <Switch checked={tableForm.active} onCheckedChange={(checked) => setTableForm((previous) => ({ ...previous, active: checked }))} />
                </div>
                <div className="flex gap-2">
                  <Button className={cn('flex-1', ADMIN_PRIMARY_BTN)} onClick={() => void submitTable()}>Guardar</Button>
                  <Button variant="outline" className={ADMIN_OUTLINE_BTN} onClick={() => setTableForm(emptyTableForm())}>Limpiar</Button>
                </div>
            </AdminFormPanel>

            <Card className={ADMIN_CARD}>
              <CardHeader><CardTitle className={ADMIN_TITLE}>Salón</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {admin.tables.map((table) => (
                  <div key={table.id} className={cn(ADMIN_LIST_ROW, 'p-4')}>
                    <div className="flex items-center justify-between">
                      <p className="font-serif text-2xl font-bold text-[#2D5A57]">Mesa {table.number}</p>
                      <StatusBadge status={table.status} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{table.capacity} personas</p>
                    <p className="text-xs text-muted-foreground">Total actual: {formatPrice(table.currentTotal ?? 0)}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <TableQrButton onClick={() => setQrTable(table)} />
                      <Button variant="outline" size="sm" className={ADMIN_OUTLINE_BTN} onClick={() => loadTable(table)}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => void admin.deleteTable(table.id).then(() => toast.success('Mesa desactivada'))}>Eliminar</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div className="mx-auto max-w-6xl space-y-4">
            <AdminPageHeader
              title="Usuarios"
              description="Accesos al sistema"
              onNew={() => {
                setUserForm(emptyUserForm())
                openFormPanel('users')
              }}
            />
            <div className="space-y-6">
            <AdminFormPanel
              panelId="users"
              title={userForm.id ? 'Editar usuario' : 'Nuevo usuario'}
              open={formPanelsOpen.users}
              onOpenChange={(open) => setFormPanelOpen('users', open)}
            >
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
                      <SelectItem value="staff">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Avatar">
                  <ImageUploadField
                    folder="users"
                    value={userForm.avatar}
                    onChange={(url) => setUserForm((previous) => ({ ...previous, avatar: url }))}
                  />
                </Field>
                <Field label={userForm.id ? 'Nueva contraseña (opcional)' : 'Contraseña'}>
                  <Input
                    type="password"
                    value={userForm.password}
                    onChange={(event) => setUserForm((previous) => ({ ...previous, password: event.target.value }))}
                    placeholder={userForm.id ? 'Dejar vacío para mantener la actual' : 'Mínimo 6 caracteres'}
                  />
                </Field>
                <div className={ADMIN_TOGGLE_ROW}>
                  <Label>Activo</Label>
                  <Switch checked={userForm.active} onCheckedChange={(checked) => setUserForm((previous) => ({ ...previous, active: checked }))} />
                </div>
                <div className="flex gap-2">
                  <Button className={cn('flex-1', ADMIN_PRIMARY_BTN)} onClick={() => void submitUser()}>Guardar</Button>
                  <Button variant="outline" className={ADMIN_OUTLINE_BTN} onClick={() => setUserForm(emptyUserForm())}>Limpiar</Button>
                </div>
            </AdminFormPanel>

            <Card className={ADMIN_CARD}>
              <CardHeader><CardTitle className={ADMIN_TITLE}>Equipo</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {admin.users.map((user) => (
                  <div key={user.id} className={cn(ADMIN_LIST_ROW, 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between')}>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-[#C5DDD9] text-[#2D5A57]">
                          {user.role === 'staff' ? 'Personal' : user.role}
                        </Badge>
                        <Badge
                          className={cn(
                            'border-0',
                            user.active ? 'bg-[#C5DDD9]/60 text-[#2D5A57]' : 'bg-destructive/15 text-destructive'
                          )}
                        >
                          {user.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2 self-end sm:self-auto">
                      <Button variant="outline" size="sm" className={ADMIN_OUTLINE_BTN} onClick={() => loadUser(user)}>Editar</Button>
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
                          className={ADMIN_PRIMARY_BTN}
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
            </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="mx-auto max-w-6xl space-y-4">
            <AdminPageHeader
              title="Configuración"
              description="Datos del negocio y operación"
              newLabel="Editar"
              onNew={() => openFormPanel('settings')}
            />
            <div className="space-y-6">
            <AdminFormPanel
              panelId="settings"
              title="Datos del negocio"
              open={formPanelsOpen.settings}
              onOpenChange={(open) => setFormPanelOpen('settings', open)}
            >
                <Field label="Nombre"><Input value={settingsDraft?.name ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, name: event.target.value } : previous)} /></Field>
                <Field label="Logo">
                  <ImageUploadField
                    folder="settings"
                    value={settingsDraft?.logo ?? ''}
                    onChange={(url) => setSettingsDraft((previous) => previous ? { ...previous, logo: url } : previous)}
                  />
                </Field>
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
                <div className={ADMIN_TOGGLE_ROW}>
                  <Label>Negocio abierto</Label>
                  <Switch checked={settingsDraft?.isOpen ?? false} onCheckedChange={(checked) => setSettingsDraft((previous) => previous ? { ...previous, isOpen: checked } : previous)} />
                </div>
                <Button className={cn('w-full', ADMIN_PRIMARY_BTN)} onClick={() => void saveSettings()}>Guardar configuración</Button>
            </AdminFormPanel>

            <Card className={ADMIN_CARD}>
              <CardHeader>
                <CardTitle className={ADMIN_TITLE}>Códigos QR</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Generá y descargá los QR del menú para imprimir en mesas o mostrador.
                </p>
              </CardHeader>
              <CardContent>
                <MenuQrSection businessName={admin.settings?.name ?? 'Menú'} />
              </CardContent>
            </Card>

            <Card className={ADMIN_CARD}>
              <CardHeader><CardTitle className={ADMIN_TITLE}>Control operativo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricCard title="Mesas atendidas hoy" value={String(admin.analytics?.tablesServedToday ?? 0)} icon={LayoutGrid} />
                  <MetricCard title="Mesas atendidas (total)" value={String(admin.analytics?.tablesServed ?? 0)} icon={LayoutGrid} />
                  <MetricCard title="Productos activos" value={String(admin.products.filter((product) => product.available).length)} icon={Package} />
                </div>
                <div className={ADMIN_LIST_ROW}>
                  <p className="text-sm font-semibold text-[#2D5A57]">Pedidos recientes</p>
                  <div className="mt-3 space-y-2">
                    {admin.orders.slice(0, 6).map((order) => (
                      <HistoryOrderRow key={order.id} order={order} compact />
                    ))}
                    {admin.orders.length === 0 && (
                      <p className="py-4 text-center text-xs text-muted-foreground">Sin pedidos recientes</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className={cn('flex-1', ADMIN_OUTLINE_BTN)} onClick={() => window.open(admin.exportSalesUrl('csv'), '_blank')}>
                    Exportar CSV
                  </Button>
                  <Button className={cn('flex-1', ADMIN_PRIMARY_BTN)} onClick={() => window.open(admin.exportSalesUrl('xlsx'), '_blank')}>
                    Exportar XLSX
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
            </div>
          )}
        </main>
      </div>

      <TableQrDialog
        table={qrTable}
        businessName={admin.settings?.name ?? 'Menú'}
        onClose={() => setQrTable(null)}
      />
    </div>
  )
}

function AdminPageHeader({
  title,
  description,
  onNew,
  newLabel = 'Nuevo',
}: {
  title: string
  description?: string
  onNew?: () => void
  newLabel?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {onNew ? (
        <Button size="sm" className={cn('shrink-0 gap-1.5', ADMIN_PRIMARY_BTN)} onClick={onNew}>
          <Plus className="h-4 w-4" />
          {newLabel}
        </Button>
      ) : null}
    </div>
  )
}

function AdminFormPanel({
  panelId,
  title,
  open,
  onOpenChange,
  children,
}: {
  panelId: FormSection
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <Card id={`admin-form-panel-${panelId}`} className={cn(ADMIN_CARD, 'scroll-mt-24')}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[#F8FBFA]"
          >
            <span className={ADMIN_TITLE}>{title}</span>
            <ChevronDown
              className={cn('h-5 w-5 shrink-0 text-[#2D5A57] transition-transform duration-200', open && 'rotate-180')}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3 border-t border-gray-100 pt-4">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function CotyPriceBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: COTY_QTY_BG, color: COTY_TEAL }}
    >
      {children}
    </span>
  )
}

function HistoryOrderRow({ order, compact = false }: { order: Order; compact?: boolean }) {
  const meta = ORDER_TYPE_META[order.type]
  const Icon = meta.icon

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg bg-[#F8FBFA] px-2.5 py-2 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: COTY_TEAL }} />
          <span className="truncate text-xs">
            {order.displayCode ?? order.id} · {order.customerName}
          </span>
        </div>
        <CotyPriceBadge>{formatPrice(order.total)}</CotyPriceBadge>
      </div>
    )
  }

  return (
    <div
      className={cn(
        ADMIN_LIST_ROW,
        'flex flex-col gap-3 border-l-4 md:flex-row md:items-center md:justify-between',
        meta.accent
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${COTY_QTY_BG}99` }}
        >
          <Icon className="h-4 w-4" style={{ color: COTY_TEAL }} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{order.displayCode ?? order.id}</p>
          <p className="truncate text-xs text-muted-foreground">
            {order.customerName} · {meta.label} · {format(order.createdAt, 'dd/MM/yyyy HH:mm', { locale: es })}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 pl-12 md:pl-0">
        <StatusBadge status={order.status} />
        <CotyPriceBadge>{formatPrice(order.total)}</CotyPriceBadge>
      </div>
    </div>
  )
}

function AdminSideNav({
  activeSection,
  onSelect,
  onLogout,
}: {
  activeSection: AdminSection
  onSelect: (section: AdminSection) => void
  onLogout: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: COTY_HEADER }}
          >
            <Coffee className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-serif text-xl font-bold leading-tight">Coty Cafe</p>
            <p className="text-xs text-muted-foreground">Panel de Administrador</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Cerrar sesión" className="shrink-0">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                isActive
                  ? 'bg-[#C5DDD9]/50 font-medium text-[#2D5A57]'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-[#2D5A57]' : 'text-[#7EB8B3]')} />
              {item.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
  comparison,
}: {
  title: string
  value: string
  icon: ElementType
  comparison?: number | null
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        {comparison !== undefined && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {comparison === null
              ? '--% vs ayer'
              : `${comparison >= 0 ? '+' : ''}${comparison.toFixed(0)}% vs ayer`}
          </p>
        )}
      </div>
      <div
        className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${COTY_QTY_BG}99` }}
      >
        <Icon className="h-5 w-5" style={{ color: COTY_TEAL }} />
      </div>
    </div>
  )
}

function SalesTypeRow({
  label,
  value,
  accentClass,
}: {
  label: string
  value: number
  accentClass: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-xl border border-gray-100 border-b-2 bg-white px-4 py-3 shadow-sm',
        accentClass
      )}
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span
        className="rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: COTY_QTY_BG, color: COTY_TEAL }}
      >
        {formatPrice(value)}
      </span>
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
      <Label className="text-xs font-medium text-[#2D5A57]/80">{label}</Label>
      {children}
    </div>
  )
}
