# Use Coolify-managed PostgreSQL over SQLite

The `/deep-design` session chose SQLite on a persistent volume for its zero-ops
simplicity at this scale. Deploying on **Coolify** changes the calculus: Coolify
provides **managed PostgreSQL with automatic scheduled backups**, whereas a
SQLite file inside an app volume has *no* managed backup and forces a
single-instance, stop-then-start deploy strategy to avoid file-lock contention
when Coolify briefly runs old and new containers during a rolling restart. We
switch to **Coolify-managed PostgreSQL** (via Drizzle's `pg` driver).

## Consequences

- Backups are handled by Coolify's database backup feature — no bespoke tooling
  (e.g. Litestream) needed.
- Deploys no longer need a recreate/single-instance constraint; the app can
  restart freely while Postgres persists as a separate service.
- Adds a Postgres service to local dev (`docker-compose`) and a managed DB in
  prod — one more moving part than a single file.
- **Supersedes** the SQLite choice in DESIGN.md (T5, F10) and the original
  `/deep-design` decision.
- Unchanged: deploys must **not** auto-run from `main` (every merge would deploy);
  use a tagged release or manual trigger.
