import { asc, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type * as schema from '../schema'
import { projects } from '../schema'

type Db = NodePgDatabase<typeof schema>

export type Project = typeof projects.$inferSelect

/** The shared, global project list, alphabetical by name (F3). */
export async function listProjects(db: Db): Promise<Project[]> {
  return db.select().from(projects).orderBy(asc(projects.name))
}

/**
 * Find-or-create a project by name, deduping case-insensitively so "Acme" and
 * "acme" resolve to one project (F3). The DB enforces the same rule via a
 * unique index on `lower(name)`; the catch handles a concurrent insert race.
 */
export async function createProject(db: Db, rawName: string): Promise<Project> {
  const name = rawName.trim()
  if (!name) throw new Error('Project name is required')

  const existing = await findByName(db, name)
  if (existing) return existing

  try {
    const [row] = await db.insert(projects).values({ name }).returning()
    return row!
  } catch (err) {
    const row = await findByName(db, name)
    if (row) return row
    throw err
  }
}

async function findByName(db: Db, name: string): Promise<Project | undefined> {
  const [row] = await db
    .select()
    .from(projects)
    .where(sql`lower(${projects.name}) = lower(${name})`)
    .limit(1)
  return row
}
