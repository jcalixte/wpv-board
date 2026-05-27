import { type } from 'arktype'

// Validated push-subscription body — the browser's PushSubscription.toJSON()
// shape (T10/F8). Never trusted from the client beyond these constraints; the
// reporter is resolved server-side from the session, not sent here.
const nonEmptyKey = type('string').narrow((s, ctx) => s.length > 0 || ctx.reject('a non-empty key'))

export const PushSubscriptionInput = type({
  endpoint: 'string.url',
  keys: {
    p256dh: nonEmptyKey,
    auth: nonEmptyKey,
  },
})

export type PushSubscriptionInputData = typeof PushSubscriptionInput.infer
