import { checkDb } from '../db/client'

export default defineEventHandler(async () => {
  return { ok: true, db: await checkDb() }
})
