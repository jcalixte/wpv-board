import { desc, eq, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type * as schema from '../schema'
import { defects, projects } from '../schema'

type Db = NodePgDatabase<typeof schema>

export interface NewDefect {
  sectionId: string
  projectId: string
  verbatim: string
  reporterEmail: string
}

/** Persist a filed defect and return the stored row. */
export async function createDefect(db: Db, input: NewDefect) {
  const [row] = await db.insert(defects).values(input).returning()
  return row
}

/** Recent defects, newest first — the dashboard feed (F5/F6). */
export async function listRecentDefects(db: Db, limit = 100) {
  return db.select().from(defects).orderBy(desc(defects.createdAt)).limit(limit)
}

export interface DefectView {
  id: string
  sectionId: string
  projectId: string
  projectName: string
  verbatim: string
  reporterEmail: string
  createdAt: Date
}

/**
 * Defects for the dashboard (F6), newest-first and joined to the project name.
 * The whole feed by default; one section's history when `sectionId` is given
 * (the lazy modal load). Always bounded by `limit`.
 */
export async function listDefects(
  db: Db,
  opts: { sectionId?: string; limit?: number } = {},
): Promise<DefectView[]> {
  return db
    .select({
      id: defects.id,
      sectionId: defects.sectionId,
      projectId: defects.projectId,
      projectName: projects.name,
      verbatim: defects.verbatim,
      reporterEmail: defects.reporterEmail,
      createdAt: defects.createdAt,
    })
    .from(defects)
    .innerJoin(projects, eq(projects.id, defects.projectId))
    .where(opts.sectionId ? eq(defects.sectionId, opts.sectionId) : undefined)
    .orderBy(desc(defects.createdAt))
    .limit(opts.limit ?? 100)
}

/** Per-section defect counts `{ sectionId: n }` for the weak-point map (F4/F6). */
export async function countDefectsBySection(db: Db): Promise<Record<string, number>> {
  const rows = await db
    .select({ sectionId: defects.sectionId, count: sql<number>`count(*)::int` })
    .from(defects)
    .groupBy(defects.sectionId)
  return Object.fromEntries(rows.map((r) => [r.sectionId, r.count]))
}
