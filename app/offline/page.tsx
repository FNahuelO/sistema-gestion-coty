import Link from 'next/link'
import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <WifiOff className="h-8 w-8 text-amber-600" />
      </div>
      <h1 className="font-serif text-2xl font-bold text-[#2D5A57]">Sin conexión</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        No hay internet en este momento. Si ya visitaste el menú antes, podés seguir viéndolo desde la app.
      </p>
      <Button asChild className="mt-6 bg-[#2D5A57] hover:bg-[#053E38]">
        <Link href="/menu">Ir al menú</Link>
      </Button>
    </div>
  )
}
