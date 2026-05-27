import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { setupTestDb, truncateAll, type TestDb } from './helpers/db'
import { createProject } from '../server/db/repositories/projects'
import { listDefects, countDefectsBySection } from '../server/db/repositories/defects'
import { defects } from '../server/db/schema'

let db: TestDb
let pool: { end: () => Promise<void> }

beforeAll(async () => {
  const setup = await setupTestDb()
  db = setup.db
  pool = setup.pool
})

afterAll(async () => {
  await pool.end()
})

// Three defects across two sections with controlled timestamps:
//   macroplan: "old" (Jan 1), "new" (Feb 1)
//   feature-kanban: "kanban" (Jan 15)
beforeEach(async () => {
  await truncateAll(db)
  const project = await createProject(db, 'Acme')
  await db.insert(defects).values([
    { sectionId: 'macroplan', projectId: project.id, verbatim: 'old', reporterEmail: 'a@theodo.com', createdAt: new Date('2026-01-01T00:00:00Z') },
    { sectionId: 'macroplan', projectId: project.id, verbatim: 'new', reporterEmail: 'a@theodo.com', createdAt: new Date('2026-02-01T00:00:00Z') },
    { sectionId: 'feature-kanban', projectId: project.id, verbatim: 'kanban', reporterEmail: 'a@theodo.com', createdAt: new Date('2026-01-15T00:00:00Z') },
  ])
})

describe('listDefects', () => {
  it('returns the feed newest-first with the project name', async () => {
    const feed = await listDefects(db)
    expect(feed.map((d) => d.verbatim)).toEqual(['new', 'kanban', 'old'])
    expect(feed[0]!.projectName).toBe('Acme')
  })

  it('filters to a single section when given one', async () => {
    const feed = await listDefects(db, { sectionId: 'macroplan' })
    expect(feed.map((d) => d.verbatim)).toEqual(['new', 'old'])
  })

  it('bounds the feed to the requested limit', async () => {
    const feed = await listDefects(db, { limit: 1 })
    expect(feed.map((d) => d.verbatim)).toEqual(['new'])
  })
})

describe('countDefectsBySection', () => {
  it('returns a per-section count map', async () => {
    expect(await countDefectsBySection(db)).toEqual({
      macroplan: 2,
      'feature-kanban': 1,
    })
  })
})
