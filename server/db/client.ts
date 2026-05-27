import pg from 'pg'

let pool: pg.Pool | undefined

/** Lazily-created shared Postgres connection pool. */
export function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  }
  return pool
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
