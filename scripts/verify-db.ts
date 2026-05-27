// Verifies the schema + repository against a real Postgres (DATABASE_URL).
// Applies migrations, round-trips a defect, and prints the result.
//   DATABASE_URL=postgres://andon:andon@localhost:5432/andon pnpm db:verify
import assert from 'node:assert/strict'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { getDb, getPool } from '../server/db/client'
import { defects, projects } from '../server/db/schema'
import { createDefect, listRecentDefects } from '../server/db/repositories/defects'

const db = getDb()

await migrate(db, { migrationsFolder: 'server/db/migrations' })

// Clean slate so the script is idempotent.
await db.delete(defects)
await db.delete(projects)

const [project] = await db.insert(projects).values({ name: 'Acme' }).returning()
assert.ok(project, 'project insert returned a row')

const defect = await createDefect(db, {
  sectionId: 'macroplan',
  projectId: project.id,
  verbatim: 'Macroplan is out of date',
  reporterEmail: 'dev@theodo.com',
})
assert.ok(defect.id, 'defect has an id')
assert.equal(defect.sectionId, 'macroplan')
assert.equal(defect.projectId, project.id)
assert.ok(defect.createdAt instanceof Date, 'createdAt is a Date')

const recent = await listRecentDefects(db)
assert.equal(recent.length, 1)
assert.equal(recent[0]!.verbatim, 'Macroplan is out of date')

console.log(`DB verify OK — defect ${defect.id} on section "${defect.sectionId}"`)
await getPool().end()
