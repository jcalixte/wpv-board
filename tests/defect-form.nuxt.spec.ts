// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineEventHandler, readBody } from 'h3'
import DefectForm from '../app/components/DefectForm.vue'

let filed: { sectionId: string; projectId: string; verbatim: string } | null

beforeEach(() => {
  filed = null
  registerEndpoint(
    '/api/projects',
    defineEventHandler(() => [{ id: 'p1', name: 'Acme' }]),
  )
  registerEndpoint(
    '/api/defects',
    defineEventHandler(async (event) => {
      filed = await readBody(event)
      return { id: 'd1', ...filed, reporterEmail: 'dev@theodo.com' }
    }),
  )
})

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>
const dialogEl = (w: Wrapper) => w.find('dialog').element as HTMLDialogElement

async function pickProject(wrapper: Wrapper) {
  await wrapper.find('[data-test="project-input"]').trigger('click')
  await wrapper.find('[data-test="project-option"]').trigger('click')
}

describe('DefectForm', () => {
  it('opens the native dialog for the clicked section and shows its name', async () => {
    const wrapper = await mountSuspended(DefectForm, { props: { sectionId: 'macroplan' } })
    await flushPromises()

    expect(dialogEl(wrapper).open).toBe(true)
    expect(wrapper.text()).toContain('Macroplan')
  })

  it('stays closed when no section is selected', async () => {
    const wrapper = await mountSuspended(DefectForm, { props: { sectionId: null } })
    await flushPromises()
    expect(dialogEl(wrapper).open).toBe(false)
  })

  it('closes the dialog when the section is cleared', async () => {
    const wrapper = await mountSuspended(DefectForm, { props: { sectionId: 'macroplan' } })
    await flushPromises()
    await wrapper.setProps({ sectionId: null })
    await flushPromises()
    expect(dialogEl(wrapper).open).toBe(false)
  })

  it('emits close when the dialog is dismissed (Escape/backdrop fire native close)', async () => {
    const wrapper = await mountSuspended(DefectForm, { props: { sectionId: 'macroplan' } })
    await flushPromises()

    dialogEl(wrapper).dispatchEvent(new Event('close'))
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('cannot submit until both a project and verbatim are provided', async () => {
    const wrapper = await mountSuspended(DefectForm, { props: { sectionId: 'macroplan' } })
    await flushPromises()

    expect(wrapper.find('[data-test="submit"]').attributes('disabled')).toBeDefined()

    await pickProject(wrapper)
    expect(wrapper.find('[data-test="submit"]').attributes('disabled')).toBeDefined()

    await wrapper.find('[data-test="verbatim"]').setValue('builds are flaky')
    expect(wrapper.find('[data-test="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('files the defect with the section, chosen project and verbatim, then emits filed', async () => {
    const wrapper = await mountSuspended(DefectForm, { props: { sectionId: 'macroplan' } })
    await flushPromises()

    await pickProject(wrapper)
    await wrapper.find('[data-test="verbatim"]').setValue('builds are flaky')
    await wrapper.find('[data-test="defect-form"]').trigger('submit')

    await vi.waitFor(() => expect(wrapper.emitted('filed')).toBeTruthy())
    expect(filed).toEqual({
      sectionId: 'macroplan',
      projectId: 'p1',
      verbatim: 'builds are flaky',
    })
  })
})
