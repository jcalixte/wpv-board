import { getDb } from '../db/client'
import { createProject } from '../db/repositories/projects'

// Create a project (case-insensitively deduped) and return it (F3).
export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: unknown }>(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Project name is required' })
  }
  return createProject(getDb(), name)
})
