import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { setupTestDb, truncateAll, type TestDb } from './helpers/db'
import { createProject, listProjects } from '../server/db/repositories/projects'

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

beforeEach(async () => {
  await truncateAll(db)
})

describe('projects repository', () => {
  it('lists nothing when no projects exist', async () => {
    expect(await listProjects(db)).toEqual([])
  })

  it('creates a project and lists it', async () => {
    const created = await createProject(db, 'Acme')
    expect(created.id).toBeDefined()
    expect(created.name).toBe('Acme')

    const list = await listProjects(db)
    expect(list).toHaveLength(1)
    expect(list[0]!.name).toBe('Acme')
  })

  it('dedupes case-insensitively — "Acme" then "acme" yields one project', async () => {
    const first = await createProject(db, 'Acme')
    const second = await createProject(db, 'acme')

    expect(second.id).toBe(first.id)
    expect(second.name).toBe('Acme') // keeps the original casing
    expect(await listProjects(db)).toHaveLength(1)
  })

  it('trims surrounding whitespace and dedupes against the trimmed name', async () => {
    const first = await createProject(db, 'Globex')
    const second = await createProject(db, '  globex  ')

    expect(second.id).toBe(first.id)
    expect(await listProjects(db)).toHaveLength(1)
  })

  it('rejects a blank name', async () => {
    await expect(createProject(db, '   ')).rejects.toThrow()
    expect(await listProjects(db)).toHaveLength(0)
  })

  it('lists projects alphabetically by name', async () => {
    await createProject(db, 'Zebra')
    await createProject(db, 'Acme')
    await createProject(db, 'Monarch')

    expect((await listProjects(db)).map((p) => p.name)).toEqual([
      'Acme',
      'Monarch',
      'Zebra',
    ])
  })
})
