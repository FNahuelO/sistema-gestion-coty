import 'dotenv/config'
import { createHash, randomUUID } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from 'pg'

const migrationsDir = join(process.cwd(), 'prisma/migrations')
const connectionString = process.env.DATABASE_URL
/** En build local sin DB, no abortar; en deploy (Vercel/CI) sí exigir DATABASE_URL. */
const requireDatabase =
  process.env.REQUIRE_DB_MIGRATE === '1' ||
  Boolean(process.env.VERCEL) ||
  Boolean(process.env.CI)

if (!connectionString) {
  if (requireDatabase) {
    console.error('Falta DATABASE_URL: no se pueden aplicar migraciones en este deploy.')
    process.exit(1)
  }
  console.warn('Sin DATABASE_URL: se omiten migraciones (build local).')
  process.exit(0)
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

/** Drift típico: la migración no está en _prisma_migrations pero el objeto ya existe. */
function isAlreadyAppliedDrift(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase()
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : ''

  return (
    code === '42701' || // duplicate_column
    code === '42P07' || // duplicate_table
    code === '42710' || // duplicate_object
    code === '42P16' || // invalid_table_definition (rare on re-run)
    message.includes('already exists') ||
    message.includes('ya existe') ||
    message.includes('duplicate')
  )
}

async function recordMigration(
  client: Client,
  migrationName: string,
  checksum: string,
  logs: string | null = null
) {
  await client.query(
    `INSERT INTO _prisma_migrations
      (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
     VALUES ($1, $2, NOW(), $3, $4, NULL, NOW(), 1)
     ON CONFLICT DO NOTHING`,
    [randomUUID(), checksum, migrationName, logs]
  )
}

async function main() {
  const client = new Client({ connectionString, connectionTimeoutMillis: 30_000 })
  await client.connect()

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _prisma_migrations (
        id VARCHAR(36) PRIMARY KEY,
        checksum VARCHAR(64) NOT NULL,
        finished_at TIMESTAMPTZ,
        migration_name VARCHAR(255) NOT NULL,
        logs TEXT,
        rolled_back_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        applied_steps_count INTEGER NOT NULL DEFAULT 0
      )
    `)

    const applied = await client.query<{ migration_name: string }>(
      'SELECT migration_name FROM _prisma_migrations WHERE rolled_back_at IS NULL'
    )
    const appliedNames = new Set(
      applied.rows.map((row: { migration_name: string }) => row.migration_name)
    )

    const pending = readdirSync(migrationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => !appliedNames.has(name))
      .sort()

    if (pending.length === 0) {
      console.log('No hay migraciones pendientes.')
      return
    }

    console.log(`Migraciones pendientes (${pending.length}): ${pending.join(', ')}`)

    for (const migrationName of pending) {
      const sqlPath = join(migrationsDir, migrationName, 'migration.sql')
      const sql = readFileSync(sqlPath, 'utf8')
      const checksum = createHash('sha256').update(sql).digest('hex')

      console.log(`Aplicando ${migrationName}...`)
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await recordMigration(client, migrationName, checksum)
        await client.query('COMMIT')
        console.log(`OK ${migrationName}`)
      } catch (error) {
        await client.query('ROLLBACK')

        if (isAlreadyAppliedDrift(error)) {
          console.warn(
            `Drift detectado en ${migrationName} (${errorMessage(error)}). Se marca como aplicada.`
          )
          await recordMigration(
            client,
            migrationName,
            checksum,
            `Baselined due to already-applied schema drift: ${errorMessage(error)}`
          )
          console.log(`OK ${migrationName} (baselined)`)
          continue
        }

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
