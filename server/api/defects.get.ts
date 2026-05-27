import { getDb } from '../db/client'
import { listDefects } from '../db/repositories/defects'

// Defect feed (F6), newest-first. `?section=ID` narrows to one section's
// history (the lazy modal load); `?limit=N` bounds the slice.
export default defineEventHandler(async (event) => {
  const { section, limit } = getQuery(event)
  return listDefects(getDb(), {
    sectionId: typeof section === 'string' ? section : undefined,
    limit: typeof limit === 'string' ? Number(limit) || undefined : undefined,
  })
})
