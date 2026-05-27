import type { H3Event } from 'h3'

/**
 * Resolves the reporter's email — the one seam between filing and auth (ADR
 * 0002). For now it returns a fixed dev identity so the filing slice works
 * before OAuth exists; Task 9 swaps this to read the verified session email.
 */
export function getReporter(_event: H3Event): string {
  return process.env.DEV_REPORTER_EMAIL ?? 'dev@theodo.com'
}
