'use client'

import { useEffect, useState } from 'react'
import {
  Download,
  Share,
  Plus,
  MoreVertical,
  Check,
  Smartphone,
  Chrome,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { COTY_HEADER, COTY_TEAL, LOGO_SRC_SVG } from '@/lib/coty-theme'

type Platform = 'ios' | 'android' | 'desktop'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIOS) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (!isIOS) return false
  // En iOS, los navegadores que no son Safari (Chrome, Firefox, etc.) no permiten instalar.
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: COTY_TEAL }}
      >
        {number}
      </span>
      <span className="pt-0.5 text-sm leading-snug text-foreground">{children}</span>
    </li>
  )
}

export function InstallAppPrompt() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [platform, setPlatform] = useState<Platform>('desktop')
  const [installed, setInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    setMounted(true)
    setPlatform(detectPlatform())
    setInstalled(isStandaloneMode())

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
      setOpen(false)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!mounted || installed) return null

  const handlePrimaryAction = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setInstalled(true)
        setOpen(false)
      }
      setDeferredPrompt(null)
      return
    }
    setOpen(true)
  }

  const iosSafari = isIOSSafari()

  return (
    <>
      <section className="mx-auto w-[92%] max-w-6xl px-0 pb-6 md:w-full md:px-8 md:pb-8">
        <div
          className="flex flex-col items-center gap-4 rounded-2xl px-5 py-6 text-center sm:flex-row sm:text-left md:rounded-3xl md:px-8 md:py-7"
          style={{ backgroundColor: COTY_HEADER }}
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 md:h-16 md:w-16">
            <Smartphone className="h-7 w-7 text-white md:h-8 md:w-8" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white md:text-lg">Instalá nuestra app</h3>
            <p className="mt-1 text-xs leading-snug text-white/75 md:text-sm">
              Pedí más rápido y accedé desde tu pantalla de inicio, sin ocupar espacio.
            </p>
          </div>
          <Button
            onClick={handlePrimaryAction}
            className="w-full shrink-0 gap-2 rounded-full bg-white font-semibold text-[#053E38] hover:bg-white/90 sm:w-auto"
          >
            <Download className="h-4 w-4" />
            {deferredPrompt ? 'Instalar ahora' : 'Cómo instalar'}
          </Button>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mb-1 flex justify-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: COTY_HEADER }}
              >
                <img src={LOGO_SRC_SVG} alt="Coty Café" className="h-auto w-8 object-contain" />
              </div>
            </div>
            <DialogTitle className="text-center text-[#2D5A57]">Instalar la app</DialogTitle>
            <DialogDescription className="text-center">
              Seguí estos pasos para agregar Coty Café a tu pantalla de inicio.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            {platform === 'ios' && (
              <div className="space-y-4">
                {!iosSafari && (
                  <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-snug text-amber-800">
                    Para instalar en iPhone o iPad, abrí esta página en{' '}
                    <span className="font-semibold">Safari</span>. Otros navegadores no permiten
                    instalar la app.
                  </div>
                )}
                <ol className="space-y-3">
                  <Step number={1}>
                    Tocá el botón{' '}
                    <span className="inline-flex items-center gap-1 font-semibold text-[#2D5A57]">
                      Compartir <Share className="inline h-3.5 w-3.5" />
                    </span>{' '}
                    en la barra de Safari.
                  </Step>
                  <Step number={2}>
                    Deslizá y elegí{' '}
                    <span className="inline-flex items-center gap-1 font-semibold text-[#2D5A57]">
                      Agregar a inicio <Plus className="inline h-3.5 w-3.5" />
                    </span>
                    .
                  </Step>
                  <Step number={3}>
                    Tocá <span className="font-semibold text-[#2D5A57]">Agregar</span> arriba a la
                    derecha. ¡Listo!
                  </Step>
                </ol>
              </div>
            )}

            {platform === 'android' && (
              <ol className="space-y-3">
                <Step number={1}>
                  Tocá el menú{' '}
                  <span className="inline-flex items-center gap-1 font-semibold text-[#2D5A57]">
                    <MoreVertical className="inline h-3.5 w-3.5" />
                  </span>{' '}
                  arriba a la derecha del navegador.
                </Step>
                <Step number={2}>
                  Elegí{' '}
                  <span className="font-semibold text-[#2D5A57]">Instalar aplicación</span> o{' '}
                  <span className="font-semibold text-[#2D5A57]">Agregar a pantalla principal</span>.
                </Step>
                <Step number={3}>
                  Confirmá tocando{' '}
                  <span className="font-semibold text-[#2D5A57]">Instalar</span>. ¡Listo!
                </Step>
              </ol>
            )}

            {platform === 'desktop' && (
              <ol className="space-y-3">
                <Step number={1}>
                  En la barra de direcciones, buscá el icono de instalar{' '}
                  <span className="inline-flex items-center gap-1 font-semibold text-[#2D5A57]">
                    <Download className="inline h-3.5 w-3.5" />
                  </span>{' '}
                  o el menú{' '}
                  <span className="inline-flex items-center gap-1 font-semibold text-[#2D5A57]">
                    <Chrome className="inline h-3.5 w-3.5" />
                  </span>
                  .
                </Step>
                <Step number={2}>
                  Elegí{' '}
                  <span className="font-semibold text-[#2D5A57]">Instalar Coty Café</span>.
                </Step>
                <Step number={3}>
                  Confirmá tocando{' '}
                  <span className="font-semibold text-[#2D5A57]">Instalar</span>. ¡Listo!
                </Step>
              </ol>
            )}

            <div
              className={cn(
                'mt-5 flex items-center gap-2 rounded-xl px-4 py-3 text-xs',
                'bg-[#F0FAF8] text-[#2D5A57]'
              )}
            >
              <Check className="h-4 w-4 shrink-0" />
              Una vez instalada, vas a poder abrirla como cualquier app desde tu inicio.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
