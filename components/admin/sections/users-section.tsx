'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { MessageCircle, Pencil, Shield, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PANEL_ACCENT_TEXT, PANEL_BADGE, PANEL_CARD, PANEL_ICON_IDLE, PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN, PANEL_TOGGLE_ROW } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import { useAdminData } from '@/lib/store'
import type { User } from '@/lib/types'
import { getStaffRoleLabel } from '@/lib/permissions'
import { ImageUploadField } from '@/components/admin/forms/image-upload-field'
import { useFormPanel } from '../hooks/use-form-panel'
import { emptyUserForm } from '../types'
import type { UserFormState } from '../types'
import { AdminFormPanel } from '../ui/admin-form-panel'
import { AdminPageHeader } from '../ui/admin-page-header'
import { Field } from '../ui/field'

function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}`
}

export function UsersSection() {
  const admin = useAdminData()
  const { open, setOpen, openPanel } = useFormPanel('users')
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm)

  const loadUser = (user: User) => {
    setUserForm({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === 'admin' ? 'admin' : 'staff',
      staffRole: user.staffRole ?? 'runner',
      phone: user.phone ?? '',
      pin: '',
      avatar: user.avatar ?? '',
      active: user.active ?? true,
      password: '',
    })
    openPanel()
  }

  const submitUser = async () => {
    try {
      const payload = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        staffRole: userForm.role === 'staff' ? userForm.staffRole : null,
        phone: userForm.phone,
        avatar: userForm.avatar,
        active: userForm.active,
        ...(userForm.password ? { password: userForm.password } : {}),
        ...(userForm.pin ? { pin: userForm.pin } : {}),
      }

      if (userForm.id) {
        await admin.updateUser(userForm.id, payload)
        toast.success('Personal actualizado')
      } else {
        await admin.addUser(payload)
        toast.success('Personal agregado')
      }

      setUserForm(emptyUserForm())
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el personal')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <AdminPageHeader
        title="Personal"
        description="Equipo, roles, contacto y accesos"
        onNew={() => {
          setUserForm(emptyUserForm())
          openPanel()
        }}
        newLabel="Agregar personal"
      />

      <AdminFormPanel
        panelId="users"
        title={userForm.id ? 'Editar personal' : 'Agregar personal'}
        open={open}
        onOpenChange={setOpen}
      >
        <Field label="Nombre y apellido">
          <Input value={userForm.name} onChange={(event) => setUserForm((previous) => ({ ...previous, name: event.target.value }))} />
        </Field>
        <Field label="Email">
          <Input type="email" value={userForm.email} onChange={(event) => setUserForm((previous) => ({ ...previous, email: event.target.value }))} />
        </Field>
        <Field label="Teléfono / WhatsApp">
          <Input
            value={userForm.phone}
            onChange={(event) => setUserForm((previous) => ({ ...previous, phone: event.target.value }))}
            placeholder="54911..."
          />
        </Field>
        <Field label="Rol">
          <Select
            value={userForm.role}
            onValueChange={(value) =>
              setUserForm((previous) => ({
                ...previous,
                role: value as User['role'],
                staffRole: value === 'staff' ? previous.staffRole ?? 'runner' : previous.staffRole,
              }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Personal operativo</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {userForm.role === 'staff' ? (
          <Field label="Función">
            <Select
              value={userForm.staffRole ?? 'runner'}
              onValueChange={(value) => setUserForm((previous) => ({ ...previous, staffRole: value as UserFormState['staffRole'] }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cashier">Cajero/a</SelectItem>
                <SelectItem value="runner">Cadete</SelectItem>
                <SelectItem value="kitchen">Cocina</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        ) : null}
        <Field label={userForm.id ? 'Nuevo PIN (4-6 dígitos, opcional)' : 'PIN (4-6 dígitos, opcional)'}>
          <Input
            inputMode="numeric"
            maxLength={6}
            value={userForm.pin}
            onChange={(event) => setUserForm((previous) => ({ ...previous, pin: event.target.value.replace(/\D/g, '') }))}
            placeholder="Ej: 1234"
          />
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
        <div className={PANEL_TOGGLE_ROW}>
          <Label>Activo</Label>
          <Switch checked={userForm.active} onCheckedChange={(checked) => setUserForm((previous) => ({ ...previous, active: checked }))} />
        </div>
        <div className="flex gap-2">
          <Button className={cn('flex-1', PANEL_PRIMARY_BTN)} onClick={() => submitUser()}>Guardar</Button>
          <Button variant="outline" className={PANEL_OUTLINE_BTN} onClick={() => setUserForm(emptyUserForm())}>Limpiar</Button>
        </div>
      </AdminFormPanel>

      <div className={cn(PANEL_CARD, 'hidden overflow-x-auto p-2 md:block')}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre y apellido</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admin.users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <Badge className={cn('mt-1 border-0', user.active ? PANEL_BADGE : 'bg-destructive/15 text-destructive')}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>{getStaffRoleLabel(user.staffRole, user.role === 'admin' ? 'admin' : 'staff')}</TableCell>
                <TableCell>
                  {user.phone ? (
                    <Button variant="outline" size="sm" className={PANEL_OUTLINE_BTN} asChild>
                      <a href={whatsappUrl(user.phone)} target="_blank" rel="noreferrer">
                        <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin teléfono</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => loadUser(user)} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Permisos" title="Permisos según rol">
                      <Shield className={cn('h-4 w-4', PANEL_ICON_IDLE)} />
                    </Button>
                    {user.active ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Desactivar"
                        onClick={() => admin.deleteUser(user.id).then(() => toast.success('Personal desactivado'))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {admin.users.map((user) => (
          <div key={user.id} className={cn(PANEL_CARD, 'space-y-3 p-4')}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Badge className={cn('shrink-0 border-0', user.active ? PANEL_BADGE : 'bg-destructive/15 text-destructive')}>
                {user.active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <p className={PANEL_ACCENT_TEXT}>{getStaffRoleLabel(user.staffRole, user.role === 'admin' ? 'admin' : 'staff')}</p>
            {user.phone ? (
              <Button variant="outline" size="sm" className={cn('h-11 w-full', PANEL_OUTLINE_BTN)} asChild>
                <a href={whatsappUrl(user.phone)} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contactar por WhatsApp
                </a>
              </Button>
            ) : null}
            <div className="flex gap-2">
              <Button variant="outline" className={cn('h-11 flex-1', PANEL_OUTLINE_BTN)} onClick={() => loadUser(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
              {user.active ? (
                <Button
                  variant="destructive"
                  className="h-11 flex-1"
                  onClick={() => admin.deleteUser(user.id).then(() => toast.success('Personal desactivado'))}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Desactivar
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
