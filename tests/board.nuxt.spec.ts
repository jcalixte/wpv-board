// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BoardView from '../app/components/BoardView.vue'
import { board, sections } from '../app/board/definition'

describe('BoardView', () => {
  it('renders every block and section from the one definition', async () => {
    const wrapper = await mountSuspended(BoardView)
    for (const block of board) {
      expect(wrapper.text()).toContain(block.title)
    }
    for (const section of sections) {
      expect(wrapper.find(`[data-section-id="${section.id}"]`).exists()).toBe(true)
      expect(wrapper.text()).toContain(section.label)
    }
  })

  it('emits the stable section id on click', async () => {
    const wrapper = await mountSuspended(BoardView)
    await wrapper.find('[data-section-id="macroplan"]').trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['macroplan'])
  })

  it('highlights a section on hover', async () => {
    const wrapper = await mountSuspended(BoardView)
    const macroplan = wrapper.find('[data-section-id="macroplan"]')
    expect(macroplan.classes()).not.toContain('is-hovered')
    await macroplan.trigger('mouseenter')
    expect(macroplan.classes()).toContain('is-hovered')
    await macroplan.trigger('mouseleave')
    expect(macroplan.classes()).not.toContain('is-hovered')
  })

  it('stacks and orders sections as on the physical board', async () => {
    const wrapper = await mountSuspended(BoardView)
    const order = wrapper
      .findAll('[data-section-id]')
      .map((el) => el.attributes('data-section-id'))
    const at = (id: string) => order.indexOf(id)
    // Product Architecture below Client Satisfaction (same column).
    expect(at('client-satisfaction')).toBeLessThan(at('product-architecture'))
    // Macroplan above Defect Visualisation, both left of Feature Kanban.
    expect(at('macroplan')).toBeLessThan(at('defect-visualisation'))
    expect(at('defect-visualisation')).toBeLessThan(at('feature-kanban'))
  })

  it('matches the rendered board snapshot', async () => {
    const wrapper = await mountSuspended(BoardView)
    expect(wrapper.html()).toMatchSnapshot()
  })
})
