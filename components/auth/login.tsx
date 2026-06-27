'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Field } from '@/components/admin/ui/field'
import { useAuth } from '@/lib/store'
import { RATE_LIMITED_ERROR } from '@/lib/auth-errors'
import type { User } from '@/lib/types'
import { COTY_HEADER, LOGO_SRC_SVG } from '@/lib/coty-theme'
import { PANEL_CARD, PANEL_PRIMARY_BTN, PANEL_TITLE } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const INPUT_CLASS =
  'h-11 border-gray-100 bg-white focus-visible:border-[#2D5A57] focus-visible:ring-[#C5DDD9]/50'

function getLoginErrorMessage(error: string | undefined, fallback: string): string {
  if (error === RATE_LIMITED_ERROR) {
    return 'Demasiados intentos fallidos. Esperá unos minutos antes de volver a intentar.'
  }
  return fallback
}

export function LoginPage() {
  const router = useRouter()
  const { login, loginWithPin, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isBusy = isSubmitting || isLoading

  const redirectAfterLogin = (authenticatedUser: User) => {
    toast.success('Inicio de sesión exitoso')
    // El admin va al panel de gestión; el personal operativo (cajero, mesero,
    // cadete, cocina) va al panel de operaciones donde se aceptan los pedidos.
    if (authenticatedUser.role === 'admin') {
      router.push('/admin')
      return
    }
    router.push('/staff')
  }

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const result = await login(email, password)
      if (result.ok) {
        redirectAfterLogin(result.user)
      } else {
        toast.error(getLoginErrorMessage(result.error, 'Credenciales inválidas'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePinSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return
    if (pin.length < 4) {
      toast.error('Ingresá un PIN válido')
      return
    }
    setIsSubmitting(true)
    try {
      const result = await loginWithPin(pin)
      if (result.ok) {
        redirectAfterLogin(result.user)
      } else {
        toast.error(getLoginErrorMessage(result.error, 'PIN inválido'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#FAFAFA] p-4"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-medium text-[#2D5A57] transition-colors hover:bg-[#C5DDD9]/40"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>

        <div className={cn(PANEL_CARD, 'overflow-hidden')}>
          <div className="border-b border-gray-100 p-5 text-center">
            <div className="mx-auto mb-3 flex items-center justify-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: COTY_HEADER }}
              >
                <img src={LOGO_SRC_SVG} alt="Coty Cafe" className="h-auto w-7 object-contain" />
              </div>
            </div>
            <h1 className="font-serif text-xl font-bold leading-tight text-foreground">Coty Cafe</h1>
            <p className="mt-1 text-xs text-muted-foreground">Acceso para personal</p>
          </div>

          <div className="space-y-4 p-5">
            <Tabs defaultValue="email">
              <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 rounded-xl border border-gray-100 bg-[#F8FBFA] p-1">
                <TabsTrigger
                  value="email"
                  className="min-h-10 rounded-lg border-0 text-sm text-gray-700 shadow-none data-[state=active]:bg-[#C5DDD9]/50 data-[state=active]:font-medium data-[state=active]:text-[#2D5A57] data-[state=active]:shadow-none"
                >
                  Email
                </TabsTrigger>
                <TabsTrigger
                  value="pin"
                  className="min-h-10 rounded-lg border-0 text-sm text-gray-700 shadow-none data-[state=active]:bg-[#C5DDD9]/50 data-[state=active]:font-medium data-[state=active]:text-[#2D5A57] data-[state=active]:shadow-none"
                >
                  PIN
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <Field label="Correo electrónico">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7EB8B3]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@correo.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={cn(INPUT_CLASS, 'pl-9')}
                        required
                      />
                    </div>
                  </Field>
                  <Field label="Contraseña">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7EB8B3]" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={cn(INPUT_CLASS, 'pl-9 pr-10')}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-[#2D5A57] hover:bg-[#C5DDD9]/40"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </Field>
                  <Button type="submit" className={cn('h-11 w-full', PANEL_PRIMARY_BTN)} disabled={isBusy}>
                    {isBusy ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="pin">
                <form onSubmit={handlePinSubmit} className="space-y-4">
                  <Field label="PIN del empleado">
                    <div className="flex justify-center pt-1">
                      <InputOTP maxLength={6} value={pin} onChange={setPin}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="h-11 w-11 border-gray-100 text-[#2D5A57]" />
                          <InputOTPSlot index={1} className="h-11 w-11 border-gray-100 text-[#2D5A57]" />
                          <InputOTPSlot index={2} className="h-11 w-11 border-gray-100 text-[#2D5A57]" />
                          <InputOTPSlot index={3} className="h-11 w-11 border-gray-100 text-[#2D5A57]" />
                          <InputOTPSlot index={4} className="h-11 w-11 border-gray-100 text-[#2D5A57]" />
                          <InputOTPSlot index={5} className="h-11 w-11 border-gray-100 text-[#2D5A57]" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </Field>
                  <Button
                    type="submit"
                    className={cn('h-11 w-full', PANEL_PRIMARY_BTN)}
                    disabled={isBusy || pin.length < 4}
                  >
                    {isBusy ? 'Verificando PIN...' : 'Entrar con PIN'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {process.env.NODE_ENV === 'development' ? (
              <div className="rounded-xl border border-gray-100 bg-[#F8FBFA] p-4">
                <p className={cn(PANEL_TITLE, 'mb-2 text-xs')}>Cuentas de prueba</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-[#2D5A57]">Admin:</span> admin@cotycafe.com
                  </p>
                  <p>
                    <span className="font-medium text-[#2D5A57]">Cajero:</span> cajero@cotycafe.com · PIN 4321
                  </p>
                  <p>
                    <span className="font-medium text-[#2D5A57]">Cadete:</span> cadete@cotycafe.com · PIN 5678
                  </p>
                  <p className="mt-2 italic">Contraseña de prueba: cotycafe123</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
