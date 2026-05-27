import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { type } from 'arktype'
import { setupTestDb, truncateAll, type TestDb } from './helpers/db'
import { createProject } from '../server/db/repositories/projects'
import { createDefect, listRecentDefects } from '../server/db/repositories/defects'
import { DefectInput } from '../server/utils/defectInput'

const UUID = '3f0a27a7-81c0-43fa-9b42-c2864ddc569b'

describe('defect input validation', () => {
  it('accepts a valid defect and trims the verbatim', () => {
    const result = DefectInput({
      sectionId: 'macroplan',
      projectId: UUID,
      verbatim: '  builds are flaky  ',
    })
    expect(result).toMatchObject({
      sectionId: 'macroplan',
      projectId: UUID,
      verbatim: 'builds are flaky',
    })
  })

  it('rejects an unknown section id', () => {
    const result = DefectInput({ sectionId: 'not-a-section', projectId: UUID, verbatim: 'x' })
    expect(result instanceof type.errors).toBe(true)
  })

  it('rejects empty / whitespace-only verbatim', () => {
    const result = DefectInput({ sectionId: 'macroplan', projectId: UUID, verbatim: '   ' })
    expect(result instanceof type.errors).toBe(true)
  })

  it('rejects a non-uuid project id', () => {
    const result = DefectInput({ sectionId: 'macroplan', projectId: 'nope', verbatim: 'x' })
    expect(result instanceof type.errors).toBe(true)
  })
})

describe('defects repository', () => {
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

  it('persists a filed defect with section, project, verbatim and reporter', async () => {
    const project = await createProject(db, 'Acme')
    const row = await createDefect(db, {
      sectionId: 'macroplan',
      projectId: project.id,
      verbatim: 'login is flaky',
      reporterEmail: 'dev@theodo.com',
    })

    expect(row).toMatchObject({
      sectionId: 'macroplan',
      projectId: project.id,
      verbatim: 'login is flaky',
      reporterEmail: 'dev@theodo.com',
    })
    expect(row.id).toBeDefined()
    expect(row.createdAt).toBeInstanceOf(Date)

    const recent = await listRecentDefects(db)
    expect(recent).toHaveLength(1)
    expect(recent[0]!.id).toBe(row.id)
  })
})
