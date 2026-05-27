import type { H3Event } from 'h3'

/**
 * Resolves the reporter's email — the one seam between filing and auth (ADR
 * 0002). Backed by the authenticated Google session (Task 9) so defects record
 * the true reporter. The auth middleware already gates the filing endpoint, so
 * a missing session here is an unexpected 401, not a normal path.
 */
export async function getReporter(event: H3Event): Promise<string> {
  const { user } = await getUserSession(event)
  if (!user?.email) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
  return user.email
}
