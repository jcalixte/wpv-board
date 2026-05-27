import { getDb } from '../db/client'
import { deleteSubscriptionByEndpoint } from '../db/repositories/pushSubscriptions'
import { getReporter } from '../utils/getReporter'
import { isOwner } from '../utils/isOwner'

// Unenrol a device — when the owner turns notifications off, the client sends
// the endpoint it is dropping. Owner-only, like enrolment.
export default defineEventHandler(async (event) => {
  const email = await getReporter(event)
  const ownerEmail = useRuntimeConfig(event).public.ownerEmail
  if (!isOwner(email, ownerEmail)) {
    throw createError({ statusCode: 403, statusMessage: 'Notifications are restricted to the owner' })
  }

  const body = await readBody<{ endpoint?: unknown }>(event)
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : ''
  if (!endpoint) {
    throw createError({ statusCode: 400, statusMessage: 'endpoint is required' })
  }

  const removed = await deleteSubscriptionByEndpoint(getDb(), endpoint)
  return { removed }
})
