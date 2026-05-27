import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { getDb } from '../db/client'

// Apply pending migrations once when the server boots (dev and prod). Skipped
// when DATABASE_URL is unset (e.g. during build) so it never blocks the bundle.
export default defineNitroPlugin(async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('[migrate] DATABASE_URL not set — skipping migrations')
    return
  }
  await migrate(getDb(), { migrationsFolder: 'server/db/migrations' })
  console.log('[migrate] migrations applied')
})
