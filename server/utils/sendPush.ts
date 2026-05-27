import webpush from 'web-push'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type * as schema from '../db/schema'
import {
  listSubscriptions,
  deleteSubscriptionByEndpoint,
} from '../db/repositories/pushSubscriptions'
import { getProjectName } from '../db/repositories/projects'
import { sections } from '../../app/board/definition'

type Db = NodePgDatabase<typeof schema>

const sectionLabels = new Map(sections.map((s) => [s.id, s.label]))

const SNIPPET_LIMIT = 140

export interface VapidConfig {
  subject: string
  publicKey: string
  privateKey: string
}

export interface FiledDefect {
  sectionId: string
  projectId: string
  verbatim: string
}

/** The notification body the service worker (T10) expects: `{ title, body, tag, url }`. */
export function buildPayload(input: { sectionLabel: string; projectName: string; verbatim: string }) {
  const snippet =
    input.verbatim.length > SNIPPET_LIMIT
      ? input.verbatim.slice(0, SNIPPET_LIMIT - 1).trimEnd() + '…'
      : input.verbatim
  return {
    title: `New defect — ${input.sectionLabel}`,
    body: `${input.projectName}: ${snippet}`,
    tag: 'defect-filed',
    url: '/defects',
  }
}

/**
 * Fan a Web Push out to every enrolled device after a defect is filed (F7).
 * Called fire-and-forget from the file-defect handler (via `event.waitUntil`)
 * so filing latency is unaffected. Never throws: a stale endpoint (404/410) is
 * pruned, any other failure is logged and the remaining devices still get sent.
 */
export async function sendPushOnDefectFiled(
  db: Db,
  vapid: VapidConfig,
  defect: FiledDefect,
): Promise<void> {
  // Without keys there is nothing to sign with (dev / preview); stay silent.
  if (!vapid.publicKey || !vapid.privateKey) return

  const subscriptions = await listSubscriptions(db)
  if (subscriptions.length === 0) return

  const projectName = (await getProjectName(db, defect.projectId)) ?? 'Unknown project'
  const sectionLabel = sectionLabels.get(defect.sectionId) ?? defect.sectionId
  const payload = JSON.stringify(buildPayload({ sectionLabel, projectName, verbatim: defect.verbatim }))

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey)

  await Promise.all(
    subscriptions.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
        .catch(async (err: unknown) => {
          if (
            err instanceof webpush.WebPushError &&
            (err.statusCode === 404 || err.statusCode === 410)
          ) {
            // The device is gone — drop it so we stop sending (the 410 path).
            await deleteSubscriptionByEndpoint(db, sub.endpoint)
          } else {
            // Transient or unexpected: keep the device, log, and move on (no retry queue in v1).
            console.error('[push] send failed for', sub.endpoint, err)
          }
        }),
    ),
  )
}
