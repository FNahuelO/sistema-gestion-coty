import 'dotenv/config'
import { createHash, randomUUID } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from 'pg'

const migrationsDir = join(process.cwd(), 'prisma/migrations')
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('Falta DATABASE_URL en .env')
  process.exit(1)
}

async function main() {
  const client = new Client({ connectionString, connectionTimeoutMillis: 30_000 })
  await client.connect()

  try {
    const applied = await client.query<{ migration_name: string }>(
      'SELECT migration_name FROM _prisma_migrations WHERE rolled_back_at IS NULL'
    )
    const appliedNames = new Set(applied.rows.map((row) => row.migration_name))

    const pending = readdirSync(migrationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => !appliedNames.has(name))
      .sort()

    if (pending.length === 0) {
      console.log('No hay migraciones pendientes.')
      return
    }

    for (const migrationName of pending) {
      const sqlPath = join(migrationsDir, migrationName, 'migration.sql')
      const sql = readFileSync(sqlPath, 'utf8')
      const checksum = createHash('sha256').update(sql).digest('hex')

      console.log(`Aplicando ${migrationName}...`)
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(
          `INSERT INTO _prisma_migrations
            (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
           VALUES ($1, $2, NOW(), $3, NULL, NULL, NOW(), 1)`,
          [randomUUID(), checksum, migrationName]
        )
        await client.query('COMMIT')
        console.log(`OK ${migrationName}`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
