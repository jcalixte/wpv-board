import { type } from 'arktype'
import { getDb } from '../db/client'
import { createDefect } from '../db/repositories/defects'
import { DefectInput } from '../utils/defectInput'
import { getReporter } from '../utils/getReporter'
import { sendPushOnDefectFiled } from '../utils/sendPush'

// File a defect against a board section (F2). Reporter comes from the seam,
// not the client; the timestamp defaults in the DB.
export default defineEventHandler(async (event) => {
  const input = DefectInput(await readBody(event))
  if (input instanceof type.errors) {
    throw createError({ statusCode: 400, statusMessage: input.summary })
  }

  const db = getDb()
  const defect = await createDefect(db, { ...input, reporterEmail: await getReporter(event) })

  // Notify subscribed devices (F7) — fire-and-forget so filing stays fast.
  // `waitUntil` keeps the runtime alive for the send without delaying the response.
  const config = useRuntimeConfig(event)
  event.waitUntil(
    sendPushOnDefectFiled(
      db,
      {
        subject: config.vapidSubject,
        publicKey: config.public.vapidPublicKey,
        privateKey: config.vapidPrivateKey,
      },
      { sectionId: defect.sectionId, projectId: defect.projectId, verbatim: defect.verbatim },
    ),
  )

  return defect
})
