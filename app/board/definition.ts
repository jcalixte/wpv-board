// The canonical board (C1) — the single source both apps render from (F1).
// Section `id`s are STABLE: defects reference them, so renaming a label is safe
// but changing an id orphans existing defects. Add/rename here, then redeploy.
//
// Each block lays its sections out as COLUMNS of vertically-stacked sections,
// mirroring the physical board (e.g. Macroplan above Defect Visualisation, both
// to the left of Feature Kanban).

export type PaperSize = 'A2' | 'A3' | 'A4'

export interface Section {
  id: string
  label: string
  size: PaperSize
}

export interface Block {
  id: string
  title: string
  /** Left-to-right columns; each column is top-to-bottom sections. */
  columns: Section[][]
}

export const board: Block[] = [
  {
    id: 'value-for-customer',
    title: 'Value for Customer',
    columns: [
      [
        { id: 'client-satisfaction', label: 'Client Satisfaction', size: 'A4' },
        { id: 'product-architecture', label: 'Product Architecture', size: 'A4' },
      ],
    ],
  },
  {
    id: 'right-first-time-jit',
    title: 'Right First Time & Just in Time',
    columns: [
      [
        { id: 'macroplan', label: 'Macroplan', size: 'A4' },
        { id: 'defect-visualisation', label: 'Defect Visualisation', size: 'A4' },
      ],
      [{ id: 'feature-kanban', label: 'Feature Kanban', size: 'A2' }],
    ],
  },
  {
    id: 'tech-enabled-network',
    title: 'Tech-Enabled Network of Teams',
    columns: [[{ id: 'tech-working-condition', label: 'Tech Working Condition', size: 'A3' }]],
  },
  {
    id: 'learning-organisation',
    title: 'Building a Learning Organisation',
    columns: [
      [{ id: 'problem-solving', label: 'Problem Solving', size: 'A3' }],
      [{ id: 'weak-point-management', label: 'Weak Point Management', size: 'A3' }],
    ],
  },
]

/** Flat list of every section, for lookups and validation. */
export const sections: Section[] = board.flatMap((block) => block.columns.flat())

/** Set of valid section ids — used server-side to validate filed defects. */
export const sectionIds: ReadonlySet<string> = new Set(sections.map((s) => s.id))
