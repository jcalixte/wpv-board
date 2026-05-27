# Andon — Weak Point Visualisation

A digital twin of the company's physical Lean/TPS project **Board**. Team members
pull the **Andon** on a board section to file a **Defect** about the board itself;
a dashboard aggregates those defects into a red-dot map that reveals the board's
**Weak Points**, so the standard can be radically improved as it rolls out
company-wide (Dantotsu).

Two apps, one codebase, behind Google SSO (`@theodo.com`):

- **`/`** — the reporting view: click an ASCII board section, pick your project,
  describe the problem.
- **`/defects`** — the same board as a red-dot defect map, a
  reverse-chronological feed, and verbatims in a modal.

Both live on one domain, `andon.apoena.dev` (ADR 0004).

## Status

**Design phase.** No code yet — the documentation below captures the agreed
language, decisions, and goal-driven design. Build order is driven by the
House of Quality: **F1 board definition → F2/F3 filing → F4/F5 weak-point map**.

## Documentation

| Document | What it holds |
|----------|---------------|
| [CONTEXT.md](./CONTEXT.md) | Ubiquitous language — the glossary (Board, Block, Section, Defect, Weak Point, Andon, Verbatim, Project, Reporter) that code, tests, and docs use verbatim. |
| [DESIGN.md](./DESIGN.md) | Goal-driven design (QFD): Goals → Functions → How → Components, the importance/conflict matrices, the critical performance budget, and the trade-off ledger. |
| [docs/house-of-quality.md](./docs/house-of-quality.md) | TikZ "House of Quality" — a visual rendering of the DESIGN.md matrices for review/slides. |
| [docs/adr/0001](./docs/adr/0001-defects-are-about-the-board-not-project-work.md) | Why a Defect is feedback about the **Board artifact**, not the reporter's project work. |
| [docs/adr/0002](./docs/adr/0002-attribution-is-transparent-not-blameless.md) | Why attribution is **transparent** rather than blameless. |
| [docs/adr/0003](./docs/adr/0003-use-coolify-managed-postgres-over-sqlite.md) | Why the data store is **Coolify-managed Postgres**, not SQLite. |
| [tasks/plan.md](./tasks/plan.md) | Implementation plan — phased, dependency-ordered tasks with acceptance criteria. |

## Stack

Nuxt 4 (full-stack Vue) · PostgreSQL + Drizzle (Coolify-managed, auto-backups) ·
Google OAuth (`hd=theodo.com` + server-side domain recheck) · Web Push (PWA) ·
Docker on Coolify.

## Running with Docker

```bash
# Production-like full stack (build the image + Postgres)
docker compose up --build              # app on http://localhost:3000

# Local development (hot-reload, source-mounted)
docker compose -f docker-compose.dev.yml up

# Or the dev server directly against a containerized Postgres
docker compose -f docker-compose.dev.yml up -d db
DATABASE_URL=postgres://andon:andon@localhost:5432/andon pnpm dev
```

Migrations are applied automatically on server boot (a Nitro plugin) — no manual
migrate step is needed.

## Deploying to Coolify

1. Point Coolify at this repo; it builds the production `Dockerfile`.
2. Create a **managed Postgres** in Coolify (automatic backups — [ADR 0003](./docs/adr/0003-use-coolify-managed-postgres-over-sqlite.md))
   and set `DATABASE_URL` to it. _(Alternatively deploy `docker-compose.yml`, which bundles a Postgres service.)_
3. Set the env vars from [`.env.example`](./.env.example) (`NUXT_SESSION_SECRET`,
   Google OAuth, VAPID) and route `andon.apoena.dev` to the service.
4. **Enable Coolify's autodeploy** so it builds and deploys on every push to
   `main`. Protect `main` with required PR review + CI so only vetted commits
   reach production.
5. The OAuth `hd` claim is spoofable — the app re-checks the email domain server-side (T9).
