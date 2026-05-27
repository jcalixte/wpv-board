// Authorisation gate for Google identities (F9, DESIGN T9).
//
// Access is restricted to the company's verified email domain. We deliberately
// ignore Google's `hd` (hosted-domain) claim as the source of truth: a personal
// account can be made to present an `hd`, so we re-derive the domain from the
// email Google itself reports as verified.
const ALLOWED_EMAIL_DOMAIN = 'theodo.com'

export interface GoogleUserInfo {
  email?: string
  email_verified?: boolean | string
  // `hd` is intentionally not consulted — see the module comment.
  hd?: string
}

export function isAllowedGoogleUser(user: GoogleUserInfo): boolean {
  const verified = user.email_verified === true || user.email_verified === 'true'
  if (!verified || !user.email) return false
  const domain = user.email.split('@')[1]?.toLowerCase()
  return domain === ALLOWED_EMAIL_DOMAIN
}
