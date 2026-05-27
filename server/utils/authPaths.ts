// Which `/api` routes bypass the default-deny auth middleware (F9).
//
// `/api/health` must answer for the orchestrator's liveness probe before any
// session exists; `/api/_auth/*` is nuxt-auth-utils' own session endpoint that
// the client uses to read/clear the session. Everything else under `/api`
// requires an authenticated session.
const PUBLIC_API_PREFIXES = ['/api/health', '/api/_auth/']

export function isPublicApiPath(path: string): boolean {
  const pathname = path.split('?')[0]!
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
