import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display, Bebas_Neue } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { AppProviders } from '@/components/providers/app-providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' })

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined,
  title: {
    default: 'Coty Café | Cafetería y comida en Carlos Spegazzini',
    template: '%s | Coty Café',
  },
  description:
    'Cafetería y gastronomía en Carlos Spegazzini. Hamburguesas, sándwichs, postres y café para disfrutar en el local o pedir con delivery en la zona.',
  keywords: [
    'Coty Café',
    'cafetería Carlos Spegazzini',
    'hamburguesas Spegazzini',
    'delivery Ezeiza',
    'café sur GBA',
    'comida para llevar',
    'postres y cafetería',
  ],
  applicationName: 'Coty Café',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Coty Café',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Coty Café | Cafetería y comida en Carlos Spegazzini',
    description:
      'Hamburguesas, sándwichs, postres y café en Carlos Spegazzini. Pedí online con delivery o retirá en el local.',
    locale: 'es_AR',
    type: 'website',
    siteName: 'Coty Café',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coty Café | Cafetería y comida en Carlos Spegazzini',
    description:
      'Hamburguesas, sándwichs, postres y café en Carlos Spegazzini. Pedí online con delivery o retirá en el local.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2d5a57' },
    { media: '(prefers-color-scheme: dark)', color: '#2d5a57' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="light bg-background">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${playfair.variable} ${bebasNeue.variable} font-sans antialiased`}
      >
        {children}
        <AppProviders />
        <Toaster richColors position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
