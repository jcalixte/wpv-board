import { type } from 'arktype'
import { sectionIds } from '../../app/board/definition'

// Validated request body for filing a defect (F2). The reporter is resolved
// server-side via the session seam, never trusted from the client. Verbatim is
// trimmed; the section must be one defined on the canonical board (C1).
export const DefectInput = type({
  sectionId: type('string').narrow(
    (id, ctx) => sectionIds.has(id) || ctx.reject('a known board section id'),
  ),
  projectId: 'string.uuid',
  verbatim: type('string')
    .pipe((s) => s.trim())
    .narrow((s, ctx) => s.length > 0 || ctx.reject('non-empty text')),
})

export type DefectInputData = typeof DefectInput.infer
