// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineEventHandler, getQuery } from 'h3'
import VerbatimModal from '../app/components/VerbatimModal.vue'

// Capture the section the modal lazily queried, and answer with that section's
// history (T6's `/api/defects?section=ID`).
let queried: string | undefined

beforeEach(() => {
  queried = undefined
  registerEndpoint(
    '/api/defects',
    defineEventHandler((event) => {
      queried = getQuery(event).section as string | undefined
      return [
        {
          id: 'd1',
          sectionId: 'macroplan',
          projectName: 'Acme',
          reporterEmail: 'dev@theodo.com',
          verbatim: 'builds are flaky',
          createdAt: '2026-05-28T10:00:00Z',
        },
      ]
    }),
  )
})

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>
const dialogEl = (w: Wrapper) => w.find('dialog').element as HTMLDialogElement

describe('VerbatimModal', () => {
  it('stays closed when no section is selected', async () => {
    const wrapper = await mountSuspended(VerbatimModal, { props: { sectionId: null } })
    await flushPromises()
    expect(dialogEl(wrapper).open).toBe(false)
  })

  it('opens for the clicked section and lists its defects with verbatim, project, reporter and date', async () => {
    const wrapper = await mountSuspended(VerbatimModal, { props: { sectionId: 'macroplan' } })
    await flushPromises()

    expect(dialogEl(wrapper).open).toBe(true)
    expect(queried).toBe('macroplan')
    // The section's human label heads the modal.
    expect(wrapper.text()).toContain('Macroplan')

    const items = wrapper.findAll('[data-test="modal-item"]')
    expect(items).toHaveLength(1)
    const text = items[0]!.text()
    expect(text).toContain('builds are flaky')
    expect(text).toContain('Acme')
    expect(text).toContain('dev@theodo.com')
    expect(text).toContain('28/05')
  })

  it('closes when the section is cleared', async () => {
    const wrapper = await mountSuspended(VerbatimModal, { props: { sectionId: 'macroplan' } })
    await flushPromises()
    await wrapper.setProps({ sectionId: null })
    await flushPromises()
    expect(dialogEl(wrapper).open).toBe(false)
  })

  it('emits close when the dialog is dismissed (Escape/backdrop fire native close)', async () => {
    const wrapper = await mountSuspended(VerbatimModal, { props: { sectionId: 'macroplan' } })
    await flushPromises()

    dialogEl(wrapper).dispatchEvent(new Event('close'))
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
