import { describe, it, expect } from 'vitest'
import { isAllowedGoogleUser } from '../server/utils/allowedGoogleUser'
import { isPublicApiPath } from '../server/utils/authPaths'

// F9: access is restricted to verified @theodo.com identities. The Google
// `hd` (hosted-domain) claim is NOT trusted on its own — we re-derive the
// domain from the verified email server-side (DESIGN T9).
describe('isAllowedGoogleUser', () => {
  it('allows a verified @theodo.com email', () => {
    expect(isAllowedGoogleUser({ email: 'jane@theodo.com', email_verified: true })).toBe(true)
  })

  it('denies a non-theodo verified email even when hd claims theodo.com', () => {
    expect(
      isAllowedGoogleUser({ email: 'attacker@gmail.com', email_verified: true, hd: 'theodo.com' }),
    ).toBe(false)
  })

  it('denies a theodo email that Google has not verified', () => {
    expect(isAllowedGoogleUser({ email: 'jane@theodo.com', email_verified: false })).toBe(false)
  })

  it('matches the domain case-insensitively', () => {
    expect(isAllowedGoogleUser({ email: 'jane@Theodo.COM', email_verified: true })).toBe(true)
  })

  it('denies when the email is missing', () => {
    expect(isAllowedGoogleUser({ email_verified: true, hd: 'theodo.com' })).toBe(false)
  })

  it('denies a look-alike domain that merely ends in theodo.com', () => {
    expect(isAllowedGoogleUser({ email: 'eve@nottheodo.com', email_verified: true })).toBe(false)
  })
})

describe('isPublicApiPath', () => {
  it('treats the health check as public', () => {
    expect(isPublicApiPath('/api/health')).toBe(true)
  })

  it('treats the session endpoint as public', () => {
    expect(isPublicApiPath('/api/_auth/session')).toBe(true)
  })

  it('gates the defects API', () => {
    expect(isPublicApiPath('/api/defects')).toBe(false)
  })

  it('ignores the query string when matching', () => {
    expect(isPublicApiPath('/api/health?probe=1')).toBe(true)
  })
})
