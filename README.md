# Andon — Weak Point Visualisation

A digital twin of the company's physical Lean/TPS project **Board**. Team members
pull the **Andon** on a board section to file a **Defect** about the board itself;
a dashboard aggregates those defects into a red-dot map that reveals the board's
**Weak Points**, so the standard can be radically improved as it rolls out
company-wide (Dantotsu).

Two apps, one codebase, behind Google SSO (`@theodo.com`):

- **`andon.apoena.dev`** — the reporting view: click an ASCII board section, pick
  your project, describe the problem.
- **`dashboard.andon.apoena.dev`** — the same board as a red-dot defect map, a
  reverse-chronological feed, and verbatims in a modal.

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

## Stack

Nuxt 3 (full-stack Vue) · SQLite + Drizzle on a persistent volume · Google
OAuth (`hd=theodo.com` + server-side domain recheck) · Web Push (PWA) ·
Docker Compose on Coolify.

## Deployment notes

- **SQLite needs a persistent Coolify volume** — without it, redeploys wipe all data.
- **Don't trust the OAuth `hd` claim alone** — verify the email domain server-side.
