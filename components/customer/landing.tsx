'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Coffee,
  MapPin,
  Clock,
  Instagram,
  Phone,
  ShoppingBag,
  Menu,
  X,
  ChevronRight,
  Truck,
  Store
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBusiness, useCart, useCatalog } from '@/lib/store'

export function CustomerLanding() {
  const { settings } = useBusiness()
  const { itemCount } = useCart()
  const { products, promotions, categories } = useCatalog()
  const [menuOpen, setMenuOpen] = useState(false)

  const featuredProducts = products.filter(p => p.featured).slice(0, 4)
  const activePromotions = promotions.filter(p => p.active)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
        <div className="flex h-18 items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <img src="/icon.svg" alt="Coty Café" className="h-11 w-11 rounded-2xl shadow-sm" />
            <div>
              <span className="block font-serif text-xl font-bold tracking-tight">Coty Café</span>
              <span className="block text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Coffee and moments</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/menu">
              <Button variant="outline" size="sm" className="relative rounded-full border-border/70 bg-card/80 px-3 shadow-sm">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <nav className="hidden items-center gap-5 md:flex">
              <Link href="/menu" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Menú
              </Link>
              <a
                href={settings.instagram ? `https://instagram.com/${settings.instagram}` : 'https://instagram.com/coty_cafe'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Instagram
              </a>
              <Link href="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Acceso Personal
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute right-0 top-0 h-full w-72 bg-background p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg font-bold">Menú</span>
                <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="mt-8 flex flex-col gap-4">
                <Link
                  href="/menu"
                  className="flex items-center justify-between rounded-lg p-3 hover:bg-muted"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="font-medium">Ver Menú</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="flex items-center justify-between rounded-lg p-3 hover:bg-muted"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="font-medium">Acceso Personal</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <a
                  href={settings.instagram ? `https://instagram.com/${settings.instagram}` : 'https://instagram.com/coty_cafe'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg p-3 hover:bg-muted"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="font-medium">Instagram</span>
                  <ChevronRight className="h-4 w-4" />
                </a>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-10 md:px-6 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(190,145,94,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(111,77,54,0.14),transparent_28%)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-4xl border border-border/70 bg-[linear-gradient(135deg,rgba(255,251,246,0.94)_0%,rgba(248,238,228,0.96)_48%,rgba(241,226,206,0.98)_100%)] shadow-[0_24px_80px_rgba(70,46,29,0.12)]">
            <div className="grid gap-10 px-6 py-10 md:grid-cols-[1.1fr_0.9fr] md:px-10 md:py-14">
              <div className="text-left">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-primary"
                >
                  Inspirado en @coty_cafe
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/90 px-4 py-2 shadow-sm"
                >
                  <span className={`h-2 w-2 rounded-full ${settings.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">
                    {settings.isOpen ? 'Abierto ahora' : 'Cerrado'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    • {settings.openTime} - {settings.closeTime}
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="max-w-2xl font-serif text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
                >
                  Un espacio cálido para café, charlas y antojos con identidad propia.
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-5 max-w-xl text-base leading-7 text-muted-foreground md:text-lg"
                >
                  Llevamos la interfaz a una estética más editorial y gastronómica: tonos espresso,
                  superficies crema y foco total en producto, promos y conversión móvil.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 flex flex-col items-start gap-4 sm:flex-row"
                >
                  <Link href="/menu">
                    <Button size="lg" className="gap-2 rounded-full px-7 shadow-lg shadow-primary/20">
                      <ShoppingBag className="h-5 w-5" />
                      Ordenar Ahora
                    </Button>
                  </Link>
                  <Link href="/menu">
                    <Button size="lg" variant="outline" className="gap-2 rounded-full border-border/70 bg-card/70 px-7">
                      <Coffee className="h-5 w-5" />
                      Ver Menú
                    </Button>
                  </Link>
                  <a
                    href={settings.instagram ? `https://instagram.com/${settings.instagram}` : 'https://instagram.com/coty_cafe'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" variant="ghost" className="gap-2 rounded-full px-6">
                      <Instagram className="h-5 w-5" />
                      Ver Instagram
                    </Button>
                  </a>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 flex flex-wrap items-center gap-5"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="h-4 w-4" />
                    <span>Delivery disponible</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Store className="h-4 w-4" />
                    <span>Retiro en local</span>
                  </div>
                </motion.div>
              </div>

              <div className="grid gap-4 md:content-start">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="overflow-hidden rounded-[1.75rem] border border-white/50 bg-[#2f221b] p-5 text-white shadow-2xl"
                >
                  <div className="flex items-center gap-3">
                    <img src="/icon.svg" alt="Coty Café" className="h-12 w-12 rounded-2xl bg-white" />
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-white/60">Brand mood</p>
                      <p className="font-serif text-2xl">Cálido, artesanal y social</p>
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-white/10 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/55">Feed</p>
                      <p className="mt-2 text-lg font-semibold">Visual</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/55">Tono</p>
                      <p className="mt-2 text-lg font-semibold">Humano</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/55">Producto</p>
                      <p className="mt-2 text-lg font-semibold">Protagonista</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-primary">Especialidad</p>
                    <p className="mt-2 font-serif text-2xl">Café y pastelería</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Una experiencia más boutique y menos “catálogo genérico”.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-primary">Canal principal</p>
                    <p className="mt-2 font-serif text-2xl">Instagram first</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Más contraste, fotografía protagonista y bloques listos para convertir.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promotions Carousel */}
      {activePromotions.length > 0 && (
        <section className="px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.24em] text-primary">Momentos para compartir</p>
              <h2 className="mt-2 font-serif text-3xl font-bold">Promociones</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto justify-around pb-4 scrollbar-hide">
              {activePromotions.map((promo, index) => (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative min-w-[320px] overflow-hidden rounded-[1.75rem] border border-black/5 shadow-xl md:min-w-[430px]"
                >
                  <img
                    src={promo.image}
                    alt={promo.title}
                    className="h-40 w-full object-cover md:h-48"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <Badge className="mb-2 bg-accent text-accent-foreground">
                      {promo.discount}% OFF
                    </Badge>
                    <h3 className="font-serif text-lg font-bold">{promo.title}</h3>
                    <p className="text-sm text-white/80">{promo.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-8 md:py-12">
        <div className="container px-4 mx-auto">
          <p className="mb-2 text-xs uppercase tracking-[0.24em] text-primary">Explorá el menú</p>
          <h2 className="mb-6 font-serif text-3xl font-bold">Categorías</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/menu?category=${category.id}`}
                  className="flex flex-col items-center gap-2 rounded-3xl border border-border/70 bg-card/80 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Coffee className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{category.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-8 md:py-12">
        <div className="container px-4 mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-primary">Selección visual</p>
              <h2 className="font-serif text-3xl font-bold">Destacados</h2>
            </div>
            <Link href="/menu">
              <Button variant="ghost" className="gap-1 rounded-full">
                Ver todo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={`/menu?product=${product.id}`}
                  className="group block overflow-hidden rounded-3xl border border-border/70 bg-card/85 transition-all hover:-translate-y-1 hover:shadow-xl"
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
                  <div className="p-3">
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {product.description}
                    </p>
                    <p className="mt-2 font-serif text-lg font-bold text-primary">
                      ${product.price}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="border-t border-border/60 bg-muted/40 py-12">
        <div className="container px-4 mx-auto">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3 shadow-sm">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Ubicación</h3>
                <p className="mt-1 text-sm text-muted-foreground">{settings.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3 shadow-sm">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Horario</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Lun - Dom: {settings.openTime} - {settings.closeTime}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3 shadow-sm">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Contacto</h3>
                <p className="mt-1 text-sm text-muted-foreground">{settings.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <img src="/icon.svg" alt="Coty Café" className="h-8 w-8 rounded-xl" />
              <span className="font-serif text-lg font-bold">Coty Café</span>
            </div>
            <div className="flex items-center gap-4">
              {settings.instagram && (
                <a
                  href={`https://instagram.com/${settings.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Coty Café. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
