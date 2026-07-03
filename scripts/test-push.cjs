const dotenv = require('dotenv')
dotenv.config()
const webpush = require('web-push')
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

;(async () => {
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:notificaciones@cotycafe.app'

  if (!pub || !priv) {
    console.error('Faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY en .env')
    process.exit(1)
  }

  webpush.setVapidDetails(subject, pub, priv)

  try {
    const res = await pool.query('SELECT * FROM "PushSubscription" ORDER BY "createdAt" DESC LIMIT 1')
    if (res.rowCount === 0) {
      console.log('No hay suscripciones guardadas.')
      return
    }

    const s = res.rows[0]
    console.log('Enviando prueba a:', s.endpoint.slice(0, 60), '...')

    const payload = JSON.stringify({
      title: 'Prueba Coty Café',
      body: 'Si ves esto, el push funciona ✅',
      url: '/order-status',
      tag: 'test-push',
    })

    try {
      const result = await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
      console.log('ENVIO OK. statusCode:', result.statusCode)
      console.log('headers:', result.headers)
    } catch (err) {
      console.error('FALLO AL ENVIAR:')
      console.error('  statusCode:', err.statusCode)
      console.error('  body:', err.body)
      console.error('  headers:', err.headers)
    }
  } catch (e) {
    console.error('ERROR DB:', e.message)
  } finally {
    await pool.end()
  }
})()
