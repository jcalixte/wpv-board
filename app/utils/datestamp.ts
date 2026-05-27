/**
 * Compact, locale-free date stamp (DD/MM/YYYY, UTC) for defect listings.
 * UTC keeps it deterministic across machines and test runs. DotMap keeps its
 * own shorter DD/MM stamp for the cramped diagonal dot labels.
 */
export function datestamp(value: string | Date): string {
  const d = new Date(value)
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getUTCFullYear()}`
}
