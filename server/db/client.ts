import pg from 'pg'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

let pool: pg.Pool | undefined
let db: NodePgDatabase<typeof schema> | undefined

/** Lazily-created shared Postgres connection pool. */
export function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  }
  return pool
}

/** Lazily-created Drizzle client bound to the shared pool. */
export function getDb(): NodePgDatabase<typeof schema> {
  if (!db) {
    db = drizzle(getPool(), { schema })
  }
  return db
}

/** Liveness probe for the database, used by /api/health. */
export async function checkDb(): Promise<'up' | 'down'> {
  try {
    await getPool().query('select 1')
    return 'up'
  } catch {
    return 'down'
  }
}
