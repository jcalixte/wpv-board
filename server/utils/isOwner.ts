// Owner-only gate for Web Push (T10). v1 notifies a single configured owner
// (DESIGN G3); the owner email comes from runtime config server-side. If no
// owner is configured, nobody qualifies — push enrolment stays closed.
export function isOwner(email: string | undefined, ownerEmail: string | undefined): boolean {
  if (!email || !ownerEmail) return false
  return email.toLowerCase() === ownerEmail.toLowerCase()
}
