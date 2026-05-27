import { desc } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type * as schema from '../schema'
import { defects } from '../schema'

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
