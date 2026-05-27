// Applies pending migrations. Run via `pnpm db:migrate`, and on container
// boot in production (wired in Task 12).
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { getDb, getPool } from './client'

await migrate(getDb(), { migrationsFolder: 'server/db/migrations' })
await getPool().end()
