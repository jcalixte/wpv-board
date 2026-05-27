import { type } from 'arktype'
import { getDb } from '../db/client'
import { createDefect } from '../db/repositories/defects'
import { DefectInput } from '../utils/defectInput'
import { getReporter } from '../utils/getReporter'

// File a defect against a board section (F2). Reporter comes from the seam,
// not the client; the timestamp defaults in the DB.
export default defineEventHandler(async (event) => {
  const input = DefectInput(await readBody(event))
  if (input instanceof type.errors) {
    throw createError({ statusCode: 400, statusMessage: input.summary })
  }
  return createDefect(getDb(), { ...input, reporterEmail: getReporter(event) })
})
