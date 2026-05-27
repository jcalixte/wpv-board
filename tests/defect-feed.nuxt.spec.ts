// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DefectFeed from '../app/components/DefectFeed.vue'

const defect = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'd1',
  sectionId: 'macroplan',
  projectName: 'Acme',
  reporterEmail: 'dev@theodo.com',
  verbatim: 'builds are flaky',
  createdAt: '2026-05-28T10:00:00Z',
  ...over,
})

describe('DefectFeed', () => {
  it('renders each defect with its date, project, reporter and verbatim', async () => {
    const wrapper = await mountSuspended(DefectFeed, {
      props: { defects: [defect()] },
    })

    const items = wrapper.findAll('[data-test="feed-item"]')
    expect(items).toHaveLength(1)
    const text = items[0]!.text()
    expect(text).toContain('28/05')
    expect(text).toContain('Acme')
    expect(text).toContain('dev@theodo.com')
    expect(text).toContain('builds are flaky')
  })

  it('preserves the feed order it is given (newest-first from the API)', async () => {
    const wrapper = await mountSuspended(DefectFeed, {
      props: {
        defects: [
          defect({ id: 'newer', verbatim: 'newer one' }),
          defect({ id: 'older', verbatim: 'older one' }),
        ],
      },
    })

    const items = wrapper.findAll('[data-test="feed-item"]')
    expect(items[0]!.text()).toContain('newer one')
    expect(items[1]!.text()).toContain('older one')
  })

  it('shows an empty state when there are no defects', async () => {
    const wrapper = await mountSuspended(DefectFeed, { props: { defects: [] } })
    expect(wrapper.findAll('[data-test="feed-item"]')).toHaveLength(0)
    expect(wrapper.find('[data-test="feed-empty"]').exists()).toBe(true)
  })
})
