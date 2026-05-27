import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type * as schema from '../schema'
import { pushSubscriptions } from '../schema'

type Db = NodePgDatabase<typeof schema>

export interface NewPushSubscription {
  endpoint: string
  p256dh: string
  auth: string
  reporterEmail: string
}

/**
 * Store (or refresh) a device's push subscription (F8). Keyed by `endpoint`:
 * re-subscribing the same device rotates its keys in place, while a different
 * device is kept as a separate row so the owner can enrol several phones.
 */
export async function saveSubscription(db: Db, sub: NewPushSubscription) {
  const [row] = await db
    .insert(pushSubscriptions)
    .values(sub)
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { p256dh: sub.p256dh, auth: sub.auth, reporterEmail: sub.reporterEmail },
    })
    .returning()
  return row!
}

/** All stored subscriptions — the fan-out target when a defect is filed (T11). */
export async function listSubscriptions(db: Db) {
  return db.select().from(pushSubscriptions)
}

/**
 * Remove a subscription by endpoint and report how many rows went. Called when
 * the push service rejects an endpoint with HTTP 410 (Gone), pruning the stale
 * device so we stop sending to it.
 */
export async function deleteSubscriptionByEndpoint(db: Db, endpoint: string): Promise<number> {
  const deleted = await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint))
    .returning({ id: pushSubscriptions.id })
  return deleted.length
}
