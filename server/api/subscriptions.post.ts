import { type } from 'arktype'
import { getDb } from '../db/client'
import { saveSubscription } from '../db/repositories/pushSubscriptions'
import { PushSubscriptionInput } from '../utils/pushSubscriptionInput'
import { getReporter } from '../utils/getReporter'
import { isOwner } from '../utils/isOwner'

// Enrol a device for Web Push (F8). Owner-only (G3): the session email must
// match the configured owner. The auth middleware already requires a session.
export default defineEventHandler(async (event) => {
  const email = await getReporter(event)
  const ownerEmail = useRuntimeConfig(event).public.ownerEmail
  if (!isOwner(email, ownerEmail)) {
    throw createError({ statusCode: 403, statusMessage: 'Notifications are restricted to the owner' })
  }

  const input = PushSubscriptionInput(await readBody(event))
  if (input instanceof type.errors) {
    throw createError({ statusCode: 400, statusMessage: input.summary })
  }

  await saveSubscription(getDb(), {
    endpoint: input.endpoint,
    p256dh: input.keys.p256dh,
    auth: input.keys.auth,
    reporterEmail: email,
  })
  return { ok: true }
})
