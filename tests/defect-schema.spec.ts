import { describe, expect, it } from 'vitest'
import { type } from 'arktype'
import { defectInput } from '../shared/schemas/defect'

const valid = {
  sectionId: 'a4-flow',
  projectId: '123e4567-e89b-12d3-a456-426614174000',
  verbatim: 'The thing broke',
}

describe('defectInput schema', () => {
  it('accepts a valid defect and trims verbatim', () => {
    const out = defectInput({ ...valid, verbatim: '  hi  ' })
    expect(out instanceof type.errors).toBe(false)
    expect((out as typeof valid).verbatim).toBe('hi')
  })

  it('rejects empty verbatim', () => {
    expect(defectInput({ ...valid, verbatim: '' }) instanceof type.errors).toBe(true)
  })

  it('rejects whitespace-only verbatim', () => {
    expect(defectInput({ ...valid, verbatim: '   ' }) instanceof type.errors).toBe(true)
  })

  it('rejects a non-uuid projectId', () => {
    expect(defectInput({ ...valid, projectId: 'not-a-uuid' }) instanceof type.errors).toBe(true)
  })
})
