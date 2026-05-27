// Integration-test harness for the Postgres-backed repositories.
//
// Tests run against a dedicated database (default `andon_test`) so they never
// touch dev data. The database is created if missing and migrated to the
// current schema; `truncateAll` resets state between tests.
import { createRequire } from 'node:module'
import type pgType from 'pg'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { sql } from 'drizzle-orm'
import * as schema from '../../server/db/schema'

// Load `pg` through a native CJS require. Importing it via Vite's SSR transform
// breaks pg's internal `class … extends Pool` (the require of `pg-pool` resolves
// to a module namespace), so we sidestep the transform entirely.
const pg = createRequire(import.meta.url)('pg') as typeof pgType

// Each Vitest worker gets its own database so specs that truncate between
// tests can't clobber one another when files run in parallel.
const TEST_URL = (() => {
  const base =
    process.env.TEST_DATABASE_URL ?? 'postgres://andon:andon@localhost:5432/andon_test'
  const url = new URL(base)
  url.pathname = `${url.pathname}_${process.env.VITEST_POOL_ID ?? '1'}`
  return url.toString()
})()

export type TestDb = NodePgDatabase<typeof schema>

/** Connect to the test database (creating + migrating it first) and return a client + pool. */
export async function setupTestDb(): Promise<{ db: TestDb; pool: pgType.Pool }> {
  await ensureDatabaseExists(TEST_URL)
  const pool = new pg.Pool({ connectionString: TEST_URL })
  const db = drizzle(pool, { schema })
  await migrate(db, { migrationsFolder: 'server/db/migrations' })
  return { db, pool }
}

/** Wipe all rows so each test starts from a clean slate. */
export async function truncateAll(db: TestDb): Promise<void> {
  await db.execute(
    sql`TRUNCATE TABLE defects, projects, push_subscriptions RESTART IDENTITY CASCADE`,
  )
}

/** Create the target database via the maintenance `postgres` DB if it doesn't exist. */
async function ensureDatabaseExists(url: string): Promise<void> {
  const dbName = new URL(url).pathname.slice(1)
  const adminUrl = new URL(url)
  adminUrl.pathname = '/postgres'

  const admin = new pg.Client({ connectionString: adminUrl.toString() })
  await admin.connect()
  try {
    const { rowCount } = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    )
    if (!rowCount) await admin.query(`CREATE DATABASE "${dbName}"`)
  } finally {
    await admin.end()
  }
}
