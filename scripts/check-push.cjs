const dotenv = require('dotenv')
dotenv.config()
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

;(async () => {
  console.log('VAPID_PUBLIC_KEY set:', Boolean(process.env.VAPID_PUBLIC_KEY))
  console.log('VAPID_PRIVATE_KEY set:', Boolean(process.env.VAPID_PRIVATE_KEY))
  console.log('VAPID_SUBJECT:', process.env.VAPID_SUBJECT || '(default)')
  try {
    const subs = await pool.query(
      'SELECT id, "orderId", left(endpoint, 45) AS endpoint, "createdAt" FROM "PushSubscription" ORDER BY "createdAt" DESC LIMIT 10'
    )
    console.log('\nTotal suscripciones push (ultimas 10):', subs.rowCount)
    console.table(subs.rows)

    const orders = await pool.query(
      'SELECT id, "displayCode", status, "estimatedMinutes", "updatedAt" FROM "Order" ORDER BY "updatedAt" DESC LIMIT 5'
    )
    console.log('Ultimos pedidos:')
    console.table(orders.rows)
  } catch (e) {
    console.error('ERROR:', e.message)
  } finally {
    await pool.end()
  }
})()
