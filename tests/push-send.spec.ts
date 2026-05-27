import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import webpush from 'web-push'
import { setupTestDb, truncateAll, type TestDb } from './helpers/db'
import { createProject } from '../server/db/repositories/projects'
import { saveSubscription, listSubscriptions } from '../server/db/repositories/pushSubscriptions'
import { buildPayload, sendPushOnDefectFiled } from '../server/utils/sendPush'

// web-push is mocked so the send never leaves the process: we assert on the
// payload it would deliver and simulate the push service's 410/404 responses.
const { sendNotification, setVapidDetails } = vi.hoisted(() => ({
  sendNotification: vi.fn(),
  setVapidDetails: vi.fn(),
}))
vi.mock('web-push', () => {
  class WebPushError extends Error {
    statusCode: number
    constructor(message: string, statusCode: number) {
      super(message)
      this.statusCode = statusCode
    }
  }
  return { default: { sendNotification, setVapidDetails, WebPushError } }
})

const vapid = { subject: 'mailto:owner@theodo.com', publicKey: 'pub-key', privateKey: 'priv-key' }

describe('buildPayload', () => {
  it('renders the section label, project and verbatim into the SW payload shape', () => {
    const payload = buildPayload({
      sectionLabel: 'Macroplan',
      projectName: 'Acme',
      verbatim: 'builds are flaky',
    })
    expect(payload).toMatchObject({
      title: expect.stringContaining('Macroplan'),
      body: expect.stringContaining('Acme'),
      url: '/defects',
    })
    expect(payload.body).toContain('builds are flaky')
  })

  it('truncates a long verbatim to a snippet', () => {
    const payload = buildPayload({
      sectionLabel: 'Macroplan',
      projectName: 'Acme',
      verbatim: 'x'.repeat(300),
    })
    expect(payload.body.length).toBeLessThan(200)
    expect(payload.body).toContain('…')
  })
})

describe('sendPushOnDefectFiled', () => {
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
    sendNotification.mockReset().mockResolvedValue(undefined)
    setVapidDetails.mockReset()
  })

  async function seedTwoDevices() {
    await saveSubscription(db, {
      endpoint: 'https://push.example/device-a',
      p256dh: 'p256dh-a',
      auth: 'auth-a',
      reporterEmail: 'owner@theodo.com',
    })
    await saveSubscription(db, {
      endpoint: 'https://push.example/device-b',
      p256dh: 'p256dh-b',
      auth: 'auth-b',
      reporterEmail: 'owner@theodo.com',
    })
  }

  it('sets VAPID details and pushes the defect to every subscribed device', async () => {
    const project = await createProject(db, 'Acme')
    await seedTwoDevices()

    await sendPushOnDefectFiled(db, vapid, {
      sectionId: 'macroplan',
      projectId: project.id,
      verbatim: 'login is flaky',
    })

    expect(setVapidDetails).toHaveBeenCalledWith(vapid.subject, vapid.publicKey, vapid.privateKey)
    expect(sendNotification).toHaveBeenCalledTimes(2)

    const [sub, payload] = sendNotification.mock.calls[0]!
    expect(sub).toMatchObject({ endpoint: expect.stringContaining('device-'), keys: expect.any(Object) })
    const decoded = JSON.parse(payload as string)
    expect(decoded.title).toContain('Macroplan')
    expect(decoded.body).toContain('Acme')
    expect(decoded.body).toContain('login is flaky')
  })

  it('prunes a subscription when the push service returns 410 Gone', async () => {
    const project = await createProject(db, 'Acme')
    await seedTwoDevices()
    sendNotification.mockImplementation((sub: webpush.PushSubscription) => {
      if (sub.endpoint.endsWith('device-a')) {
        return Promise.reject(new webpush.WebPushError('gone', 410))
      }
      return Promise.resolve(undefined)
    })

    await sendPushOnDefectFiled(db, vapid, {
      sectionId: 'macroplan',
      projectId: project.id,
      verbatim: 'x',
    })

    const remaining = (await listSubscriptions(db)).map((s) => s.endpoint)
    expect(remaining).toEqual(['https://push.example/device-b'])
  })

  it('prunes a subscription when the push service returns 404 Not Found', async () => {
    const project = await createProject(db, 'Acme')
    await seedTwoDevices()
    sendNotification.mockImplementation((sub: webpush.PushSubscription) =>
      sub.endpoint.endsWith('device-a')
        ? Promise.reject(new webpush.WebPushError('not found', 404))
        : Promise.resolve(undefined),
    )

    await sendPushOnDefectFiled(db, vapid, {
      sectionId: 'macroplan',
      projectId: project.id,
      verbatim: 'x',
    })

    const remaining = (await listSubscriptions(db)).map((s) => s.endpoint)
    expect(remaining).toEqual(['https://push.example/device-b'])
  })

  it('keeps the subscription and does not throw on a transient send error', async () => {
    const project = await createProject(db, 'Acme')
    await seedTwoDevices()
    sendNotification.mockImplementation((sub: webpush.PushSubscription) =>
      sub.endpoint.endsWith('device-a')
        ? Promise.reject(new webpush.WebPushError('server error', 500))
        : Promise.resolve(undefined),
    )

    await expect(
      sendPushOnDefectFiled(db, vapid, {
        sectionId: 'macroplan',
        projectId: project.id,
        verbatim: 'x',
      }),
    ).resolves.toBeUndefined()

    // A 500 is transient — both devices are kept for the next defect.
    expect((await listSubscriptions(db)).length).toBe(2)
  })

  it('does nothing when there are no subscriptions', async () => {
    const project = await createProject(db, 'Acme')
    await sendPushOnDefectFiled(db, vapid, {
      sectionId: 'macroplan',
      projectId: project.id,
      verbatim: 'x',
    })
    expect(sendNotification).not.toHaveBeenCalled()
  })

  it('is a no-op when VAPID keys are not configured', async () => {
    const project = await createProject(db, 'Acme')
    await seedTwoDevices()

    await sendPushOnDefectFiled(
      db,
      { subject: 'mailto:owner@theodo.com', publicKey: '', privateKey: '' },
      { sectionId: 'macroplan', projectId: project.id, verbatim: 'x' },
    )

    expect(setVapidDetails).not.toHaveBeenCalled()
    expect(sendNotification).not.toHaveBeenCalled()
  })
})
