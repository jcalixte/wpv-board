import { type } from 'arktype'

/**
 * The user-supplied fields when filing a defect. `reporterEmail` and the
 * timestamp are resolved server-side (getReporter / DB default), so they are
 * not part of this input. This is the single source of validation truth shared
 * by the DefectForm and the /api/defects route (wired in Task 5); import it via
 * the `#shared` alias from either client or server.
 */
export const defectInput = type({
  // section_id comes from the clicked board section — a non-empty slug.
  sectionId: type('string.trim').to('string >= 1'),
  // projectId references projects.id, a uuid.
  projectId: 'string.uuid',
  // The reporter's words — required, trimmed.
  verbatim: type('string.trim').to('string >= 1'),
})

export type DefectInput = typeof defectInput.infer
