import { isPublicApiPath } from '../utils/authPaths'

// Default-deny gate for the data API (F9). Every `/api` route requires an
// authenticated session except the explicitly public ones (health probe, the
// session endpoint). Pages are guarded separately by app/middleware/auth.global
// so static assets and the OAuth route stay reachable while unauthenticated.
export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/')) return
  if (isPublicApiPath(event.path)) return

  const { user } = await getUserSession(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
})
