import { describe, it, expect } from 'vitest'
import { type } from 'arktype'
import { isOwner } from '../server/utils/isOwner'
import { PushSubscriptionInput } from '../server/utils/pushSubscriptionInput'

// T10: only the configured owner may enrol for push (decided owner-only).
describe('isOwner', () => {
  it('recognises the configured owner, case-insensitively', () => {
    expect(isOwner('Owner@Theodo.com', 'owner@theodo.com')).toBe(true)
  })

  it('denies anyone who is not the owner', () => {
    expect(isOwner('someone@theodo.com', 'owner@theodo.com')).toBe(false)
  })

  it('denies everyone when no owner is configured', () => {
    expect(isOwner('owner@theodo.com', '')).toBe(false)
    expect(isOwner('owner@theodo.com', undefined)).toBe(false)
  })

  it('denies when the email is missing', () => {
    expect(isOwner(undefined, 'owner@theodo.com')).toBe(false)
  })
})

// The body is the browser's PushSubscription.toJSON() shape, untrusted.
describe('PushSubscriptionInput', () => {
  const valid = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
    keys: { p256dh: 'BNc...key', auth: 'tok' },
  }

  it('accepts a well-formed browser subscription', () => {
    expect(PushSubscriptionInput(valid)).toMatchObject(valid)
  })

  it('rejects a non-url endpoint', () => {
    expect(PushSubscriptionInput({ ...valid, endpoint: 'not-a-url' }) instanceof type.errors).toBe(
      true,
    )
  })

  it('rejects a missing keys object', () => {
    expect(PushSubscriptionInput({ endpoint: valid.endpoint }) instanceof type.errors).toBe(true)
  })

  it('rejects an empty key', () => {
    expect(
      PushSubscriptionInput({ ...valid, keys: { p256dh: '', auth: 'tok' } }) instanceof type.errors,
    ).toBe(true)
  })
})
