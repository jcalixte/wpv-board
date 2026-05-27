import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { setupTestDb, truncateAll, type TestDb } from './helpers/db'
import {
  saveSubscription,
  listSubscriptions,
  deleteSubscriptionByEndpoint,
} from '../server/db/repositories/pushSubscriptions'

// T10/F8: the owner enrols one or more devices for Web Push. Subscriptions are
// keyed by their push endpoint so re-subscribing the same device is idempotent,
// distinct devices are kept side by side, and a 410 from the push service
// prunes the stale one (the pruning itself happens when T11 sends).
describe('push subscriptions repository', () => {
  let db: TestDb
  let pool: { end: () => Promise<void> }

  beforeAll(async () => {
    const setup = await setupTestDb()
    db = setup.db
    pool = setup.pool
  })

  afterAll(async () => {
    await pool.end()
  })

  beforeEach(async () => {
    await truncateAll(db)
  })

  const subA = {
    endpoint: 'https://push.example/device-a',
    p256dh: 'p256dh-a',
    auth: 'auth-a',
    reporterEmail: 'owner@theodo.com',
  }
  const subB = {
    endpoint: 'https://push.example/device-b',
    p256dh: 'p256dh-b',
    auth: 'auth-b',
    reporterEmail: 'owner@theodo.com',
  }

  it('stores a subscription', async () => {
    await saveSubscription(db, subA)

    const all = await listSubscriptions(db)
    expect(all).toHaveLength(1)
    expect(all[0]).toMatchObject({
      endpoint: subA.endpoint,
      p256dh: subA.p256dh,
      auth: subA.auth,
      reporterEmail: subA.reporterEmail,
    })
  })

  it('keeps a second device as a separate subscription', async () => {
    await saveSubscription(db, subA)
    await saveSubscription(db, subB)

    const endpoints = (await listSubscriptions(db)).map((s) => s.endpoint).sort()
    expect(endpoints).toEqual([subA.endpoint, subB.endpoint])
  })

  it('re-subscribing the same endpoint updates in place rather than duplicating', async () => {
    await saveSubscription(db, subA)
    await saveSubscription(db, { ...subA, p256dh: 'rotated-key', auth: 'rotated-auth' })

    const all = await listSubscriptions(db)
    expect(all).toHaveLength(1)
    expect(all[0]).toMatchObject({ p256dh: 'rotated-key', auth: 'rotated-auth' })
  })

  it('prunes a subscription by endpoint (the 410 path)', async () => {
    await saveSubscription(db, subA)
    await saveSubscription(db, subB)

    const removed = await deleteSubscriptionByEndpoint(db, subA.endpoint)

    expect(removed).toBe(1)
    expect((await listSubscriptions(db)).map((s) => s.endpoint)).toEqual([subB.endpoint])
  })

  it('pruning an unknown endpoint is a no-op', async () => {
    await saveSubscription(db, subA)

    const removed = await deleteSubscriptionByEndpoint(db, 'https://push.example/gone')

    expect(removed).toBe(0)
    expect(await listSubscriptions(db)).toHaveLength(1)
  })
})
