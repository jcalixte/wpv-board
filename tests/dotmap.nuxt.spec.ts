// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import DotMap from '../app/components/DotMap.vue'

// The section box the overlay dots are rendered inside (BoardView marks each
// section with `data-section-id`).
const section = (wrapper: VueWrapper, id: string) =>
  wrapper.find(`[data-section-id="${id}"]`)

describe('DotMap', () => {
  it('renders a red dot with a date label inside the defect’s section', async () => {
    const wrapper = await mountSuspended(DotMap, {
      props: {
        defects: [{ id: 'd1', sectionId: 'macroplan', createdAt: '2026-05-28T10:00:00Z' }],
        counts: { macroplan: 1 },
      },
    })

    const dots = section(wrapper, 'macroplan').findAll('[data-test="dot"]')
    expect(dots).toHaveLength(1)
    expect(dots[0]!.text()).toContain('28/05')

    // A section with no defects shows no dots.
    expect(section(wrapper, 'problem-solving').findAll('[data-test="dot"]')).toHaveLength(0)
  })

  it('caps visible dots and collapses the overflow to "+N more"', async () => {
    const cap = 10
    const defects = Array.from({ length: 15 }, (_, i) => ({
      id: `d${i}`,
      sectionId: 'feature-kanban',
      createdAt: '2026-05-28T10:00:00Z',
    }))

    const wrapper = await mountSuspended(DotMap, {
      // Feed holds 15 for this section but the true total is 42 (counts).
      props: { defects, counts: { 'feature-kanban': 42 }, cap },
    })

    const box = section(wrapper, 'feature-kanban')
    expect(box.findAll('[data-test="dot"]')).toHaveLength(cap)
    const more = box.find('[data-test="more"]')
    expect(more.exists()).toBe(true)
    expect(more.text()).toContain('+32 more') // 42 total − 10 shown
  })

  it('shows no overflow marker when a section is at or below the cap', async () => {
    const wrapper = await mountSuspended(DotMap, {
      props: {
        defects: [{ id: 'd1', sectionId: 'macroplan', createdAt: '2026-05-28T10:00:00Z' }],
        counts: { macroplan: 1 },
      },
    })

    expect(section(wrapper, 'macroplan').find('[data-test="more"]').exists()).toBe(false)
  })
})
