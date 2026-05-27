import { getDb } from '../../db/client'
import { countDefectsBySection } from '../../db/repositories/defects'

// Per-section defect counts `{ sectionId: n }` for the weak-point map (F4/F6).
export default defineEventHandler(async () => {
  return countDefectsBySection(getDb())
})
