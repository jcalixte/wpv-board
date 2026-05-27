// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineEventHandler, readBody } from 'h3'
import ProjectAutocomplete from '../app/components/ProjectAutocomplete.vue'

interface Row {
  id: string
  name: string
}

let store: Row[]

beforeEach(() => {
  store = [
    { id: '1', name: 'Acme' },
    { id: '2', name: 'Globex' },
  ]
  // One endpoint backing both list (GET) and creatable autocomplete (POST),
  // deduping case-insensitively like the real API.
  registerEndpoint(
    '/api/projects',
    defineEventHandler(async (event) => {
      if (event.method === 'GET') return store
      const { name } = await readBody<{ name: string }>(event)
      const trimmed = name.trim()
      const existing = store.find(
        (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
      )
      if (existing) return existing
      const created = { id: String(store.length + 1), name: trimmed }
      store.push(created)
      return created
    }),
  )
})

describe('ProjectAutocomplete', () => {
  it('lists the existing projects when opened', async () => {
    const wrapper = await mountSuspended(ProjectAutocomplete)
    await flushPromises()

    await wrapper.find('[data-test="project-input"]').trigger('click')
    const names = wrapper
      .findAll('[data-test="project-option"]')
      .map((el) => el.text())
    expect(names).toContain('Acme')
    expect(names).toContain('Globex')
  })

  it('offers to create a project that does not exist yet', async () => {
    const wrapper = await mountSuspended(ProjectAutocomplete)
    await flushPromises()

    const input = wrapper.find('[data-test="project-input"]')
    await input.setValue('Initech')
    expect(wrapper.find('[data-test="project-create"]').exists()).toBe(true)
  })

  it('does not offer to create a name that already exists (case-insensitive)', async () => {
    const wrapper = await mountSuspended(ProjectAutocomplete)
    await flushPromises()

    await wrapper.find('[data-test="project-input"]').setValue('acme')
    expect(wrapper.find('[data-test="project-create"]').exists()).toBe(false)
  })

  it('persists a new project, selects it, and makes it selectable without reload', async () => {
    const wrapper = await mountSuspended(ProjectAutocomplete)
    await flushPromises()

    await wrapper.find('[data-test="project-input"]').setValue('Initech')
    await wrapper.find('[data-test="project-create"]').trigger('click')

    // Selected and emitted to the parent (the POST resolves asynchronously).
    await vi.waitFor(() => {
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
    await flushPromises()
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted.at(-1)![0]).toMatchObject({ name: 'Initech' })

    // Persisted to the store and now selectable without reload — reopening the
    // list (the create flow closes it) shows the new project.
    expect(store.map((p) => p.name)).toContain('Initech')
    await wrapper.find('[data-test="project-input"]').trigger('click')
    const names = wrapper
      .findAll('[data-test="project-option"]')
      .map((el) => el.text())
    expect(names).toContain('Initech')
  })
})
