import 'dotenv/config'
import { spawn, type ChildProcess } from 'node:child_process'
import process from 'node:process'
import localtunnel from 'localtunnel'

const port = Number(process.env.PORT ?? 3000)
const subdomain = process.env.TUNNEL_SUBDOMAIN?.trim() || undefined

let nextProcess: ChildProcess | null = null

async function main() {
  const tunnel = await localtunnel({
    port,
    subdomain,
  })

  const tunnelUrl = tunnel.url

  console.log('')
  console.log(`Tunnel URL: ${tunnelUrl}`)
  console.log(`NextAuth URL: ${tunnelUrl}`)
  console.log(`Mercado Pago webhook: ${tunnelUrl}/api/payments/mercadopago/webhook`)
  console.log('')

  nextProcess = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['next', 'dev', '--port', String(port)], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXTAUTH_URL: tunnelUrl,
      TUNNEL_URL: tunnelUrl,
      PORT: String(port),
    },
  })

  const shutdown = () => {
    tunnel.close()
    if (nextProcess && !nextProcess.killed) {
      nextProcess.kill('SIGINT')
    }
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  tunnel.on('close', () => {
    console.log('Tunnel cerrado')
    if (nextProcess && !nextProcess.killed) {
      nextProcess.kill('SIGINT')
    }
  })

  nextProcess.on('exit', (code) => {
    tunnel.close()
    process.exit(code ?? 0)
  })
}

main().catch((error) => {
  console.error('No se pudo iniciar el túnel local:', error)
  process.exit(1)
})
