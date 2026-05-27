import { getDb } from '../db/client'
import { listProjects } from '../db/repositories/projects'

// The shared, global project list (F3).
export default defineEventHandler(async () => {
  return listProjects(getDb())
})
