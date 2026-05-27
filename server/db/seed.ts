// Seed defects for perf-checking the dashboard (F6 target: ≤1s at ~2k rows).
//   SEED_COUNT=2000 pnpm db:seed
import { getDb, getPool } from './client'
import { createProject } from './repositories/projects'
import { defects } from './schema'
import { sections } from '../../app/board/definition'

const count = Number(process.env.SEED_COUNT ?? 2000)
const db = getDb()

const project = await createProject(db, 'Seed Project')
const rows = Array.from({ length: count }, (_, i) => ({
  sectionId: sections[i % sections.length]!.id,
  projectId: project.id,
  verbatim: `seeded defect #${i}`,
  reporterEmail: 'seed@theodo.com',
  // Spread timestamps so the feed ordering is meaningful.
  createdAt: new Date(Date.now() - i * 60_000),
}))

await db.insert(defects).values(rows)
console.log(`[seed] inserted ${count} defects`)
await getPool().end()
