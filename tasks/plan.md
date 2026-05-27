# Implementation Plan: Andon — Weak Point Visualisation

## Overview

Build the Andon app per [DESIGN.md](../DESIGN.md): a Nuxt 3 full-stack Vue app
serving two domains (`andon.apoena.dev` reporting, `dashboard.andon.apoena.dev`
viewing), backed by SQLite/Drizzle, gated by Google SSO, with Web Push to the
owner. Team members file **Defects** about board **Sections**; the dashboard
renders a red-dot **Weak Point** map. Build order follows the House of Quality
weights: the board definition (F1) is the spine, then frictionless filing
(F2/F3), then the weak-point map (F4/F5), then auth (F9), notifications (F7/F8),
and deployment/durability (F10).

## Architecture Decisions

- **Single Nuxt 3 app, two domains** — host-based routing selects the reporting
  vs dashboard view; one auth layer, one DB, one board-definition module shared
  by both (DESIGN §3, F1). Avoids drift between the apps.
- **Coolify-managed PostgreSQL + Drizzle (`pg` driver)** — automatic backups and
  no single-instance deploy constraint; chosen over SQLite once deploying on
  Coolify (DESIGN T5, F10, ADR 0003). Local dev runs Postgres via docker-compose.
- **Reporter is resolved through one `getReporter()` seam** — in early phases it
  returns a dev identity; the real Google session is swapped in at Task 9. This
  keeps the filing slice buildable before OAuth credentials exist, with minimal
  rework (ADR 0002).
- **Package manager: pnpm; tests: Vitest + `@nuxt/test-utils` for unit/component,
  Playwright for end-to-end.** Adjust if the team standard differs.
- **Defect is append-only, Section-level** — no lifecycle, no exact-spot pin
  (DESIGN T2/T7, ADR 0001).

## Dependency Graph

```
T1 Scaffold (Nuxt + tooling + Docker dev)
 ├── T2 Board-definition (C1) + BoardView (C2)      ── spine, F1
 │        ├── T5 Defect filing (C3 form)            ── F2
 │        ├── T7 DotMap (C5)                         ── F4
 │        └── T8 VerbatimModal + Feed (C6)           ── F5
 ├── T3 DB schema + migrations (C8)
 │        ├── T4 Projects API + autocomplete (C4)    ── F3 ─┐
 │        ├── T5 Defect filing API + form            ──────┤ (needs T2, T3, T4)
 │        ├── T6 Defects read API (feed + counts)    ── F6 │
 │        └── T10 Push subscription store            ──────┘
 ├── T6 ──→ T7, T8
 ├── T9 Google OAuth + domain middleware (C9)        ── F9, cross-cutting
 │        └── replaces getReporter() stub from T5
 ├── T10 Web Push subscribe + SW (C10) ──→ T11 Send push on file (F7)
 └── T12 Docker image + compose + Coolify volume (C11) ── F10, depends on all
```

Bottom-up: foundation (T1, T3) → spine (T2) → filing slice (T4, T5) → weak-point
slice (T6–T8) → auth (T9) → notifications (T10, T11) → ship (T12).

## Task List

### Phase 1 — Foundation & board spine

#### Task 1: Scaffold the Nuxt 3 app with tooling and Dockerised dev

**Description:** Create the Nuxt 3 + TypeScript project, configure ESLint,
Vitest + `@nuxt/test-utils`, Drizzle (`pg` driver), and a dev Dockerfile +
compose (app + Postgres service) so the app runs locally the same way it will on
Coolify. Add a `/api/health` route that also checks the DB connection.

**Acceptance criteria:**
- [ ] `pnpm dev` serves the app; `GET /api/health` returns `{ ok: true }` incl. DB ping.
- [ ] `pnpm test` and `pnpm build` run green on an empty suite.
- [ ] `docker compose up` builds the app and starts Postgres; app connects via `DATABASE_URL`.

**Verification:**
- [ ] Build succeeds: `pnpm build`
- [ ] Tests run: `pnpm test`
- [ ] Manual: open dev server, hit `/api/health`

**Dependencies:** None
**Files likely touched:** `package.json`, `nuxt.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `server/api/health.get.ts`, `Dockerfile.dev`, `docker-compose.yml`
**Estimated scope:** M

#### Task 2: Board-definition module (C1) + BoardView component (C2)

**Description:** Encode the canonical board (4 Blocks, their Sections with stable
IDs, sizes, grid placement) in one TS module, and render it as the ASCII-styled
DOM grid: bordered monospace section boxes that highlight on hover and emit the
section ID on click. Both views import this single module (F1).

**Acceptance criteria:**
- [ ] All Blocks/Sections from DESIGN render from the one definition module.
- [ ] Hovering a Section highlights it; clicking emits its stable ID.
- [ ] Snapshot test pins the rendered board so the two apps can't drift.

**Verification:**
- [ ] Component test: `pnpm test -- board`
- [ ] Snapshot matches: `pnpm test -- --grep board-snapshot`
- [ ] Manual: hover/click each Section, confirm correct ID in a handler

**Dependencies:** T1
**Files likely touched:** `app/board/definition.ts`, `app/components/BoardView.vue`, `tests/board.spec.ts`
**Estimated scope:** M

### Checkpoint: Foundation
- [ ] `pnpm build` and `pnpm test` pass
- [ ] Board renders and is interactive in the browser
- [ ] Review with human before proceeding

### Phase 2 — File a defect (Goal G1)

#### Task 3: Database schema and migrations (C8)

**Description:** Define Drizzle (Postgres) schema for `projects`, `defects`
(section_id, project_id, verbatim, reporter_email, created_at), and
`push_subscriptions`; generate and apply the migration; expose a typed DB client.

**Acceptance criteria:**
- [ ] Migration creates the three tables with the columns above.
- [ ] A repository helper can insert and read a defect against a test Postgres DB.
- [ ] `defects.section_id` is a plain string (no FK) referencing C1 IDs (ADR 0001).

**Verification:**
- [ ] Migration test: `pnpm test -- db`
- [ ] Manual: run migration against the dev Postgres, inspect schema

**Dependencies:** T1
**Files likely touched:** `server/db/schema.ts`, `server/db/client.ts`, `drizzle.config.ts`, `server/db/migrations/*`, `tests/db.spec.ts`
**Estimated scope:** S

#### Task 4: Projects API + ProjectAutocomplete (C4) — F3

**Description:** `GET /api/projects` (list) and `POST /api/projects`
(create, case-insensitive dedupe) plus a creatable autocomplete component that
lists existing projects and persists a new one inline.

**Acceptance criteria:**
- [ ] Listing returns the shared global project list.
- [ ] Creating "Acme" then "acme" yields one project (deduped).
- [ ] New project becomes selectable without reload.

**Verification:**
- [ ] API + dedupe test: `pnpm test -- projects`
- [ ] Manual: type a new project, submit, re-open select and see it

**Dependencies:** T3
**Files likely touched:** `server/api/projects.get.ts`, `server/api/projects.post.ts`, `app/components/ProjectAutocomplete.vue`, `tests/projects.spec.ts`
**Estimated scope:** M

#### Task 5: File a defect — POST /api/defects + DefectForm (C3) — F2

**Description:** Wire a BoardView Section click to open a modal with the
ProjectAutocomplete + a Verbatim textarea; submit persists a defect. Reporter is
resolved via a `getReporter()` seam returning a dev identity for now; timestamp
auto. Target ≤3 interactions / ≤15s.

**Acceptance criteria:**
- [ ] Click Section → modal → pick project + type verbatim → submit persists a row.
- [ ] Filing takes ≤3 interactions after landing on the board.
- [ ] Verbatim and project are required; section_id comes from the click.

**Verification:**
- [ ] Slice test: `pnpm test -- defect-filing`
- [ ] E2E: `pnpm e2e -- file-defect`
- [ ] Manual: file a defect, confirm DB row with correct section/project/verbatim/dev-reporter

**Dependencies:** T2, T3, T4
**Files likely touched:** `server/api/defects.post.ts`, `server/utils/getReporter.ts`, `app/components/DefectForm.vue`, `app/pages/index.vue` (andon view), `tests/defect-filing.spec.ts`
**Estimated scope:** M

### Checkpoint: Filing works
- [ ] A defect can be filed end-to-end (dev auth) and is persisted
- [ ] All tests pass, build clean
- [ ] Review with human before proceeding

### Phase 3 — See weak points (Goal G2)

#### Task 6: Defects read API — feed + per-section counts (C7) — F6

**Description:** `GET /api/defects` returning a reverse-chronological feed
(bounded slice) and `GET /api/defects/counts` returning per-section counts;
`GET /api/defects?section=ID` for one section's history (lazy, for the modal).
Index `(section_id, created_at)`. Target ≤1s at ~2k rows.

**Acceptance criteria:**
- [ ] Feed returns newest-first, bounded.
- [ ] Counts endpoint returns `{ sectionId: n }` for all sections.
- [ ] With 2,000 seeded defects, dashboard queries return in ≤1s.

**Verification:**
- [ ] API test: `pnpm test -- defects-read`
- [ ] Perf check: seed 2k rows, time the endpoints
- [ ] Manual: hit each endpoint, eyeball ordering and counts

**Dependencies:** T3
**Files likely touched:** `server/api/defects.get.ts`, `server/api/defects/counts.get.ts`, `server/db/seed.ts`, `tests/defects-read.spec.ts`
**Estimated scope:** M

#### Task 7: Dashboard DotMap (C5) — F4

**Description:** On the dashboard view, overlay each defect as a red dot inside
its Section box with a diagonal date label; cap visible dots (~8–12) and collapse
overflow to a "+N more" marker. Reuses BoardView (C2) + counts/feed from T6.

**Acceptance criteria:**
- [ ] Dots render inside the correct Section with diagonal date labels.
- [ ] A Section over the cap shows the cap + "+N more".
- [ ] Dashboard view loads at `dashboard.` host (or dev equivalent).

**Verification:**
- [ ] Component test: `pnpm test -- dotmap`
- [ ] Manual: seed a hot Section past the cap, confirm "+N more"

**Dependencies:** T2, T6
**Files likely touched:** `app/components/DotMap.vue`, `app/pages/dashboard.vue`, `tests/dotmap.spec.ts`
**Estimated scope:** M

#### Task 8: VerbatimModal + reverse-chronological Feed (C6) — F5

**Description:** Clicking a Section/dot opens a modal listing that Section's
defects (date, project, reporter, verbatim) without leaving the board; a feed
list beside the board shows all defects newest-first.

**Acceptance criteria:**
- [ ] Click Section/dot → modal lists that Section's defects; board stays visible.
- [ ] Feed shows all defects newest-first with date/project/reporter.
- [ ] Closing the modal returns to the board unchanged.

**Verification:**
- [ ] Component test: `pnpm test -- verbatim-modal`
- [ ] E2E: `pnpm e2e -- dashboard-view`
- [ ] Manual: open/close modal on a populated Section

**Dependencies:** T6, T7
**Files likely touched:** `app/components/VerbatimModal.vue`, `app/components/DefectFeed.vue`, `app/pages/dashboard.vue`, `tests/verbatim-modal.spec.ts`
**Estimated scope:** M

### Checkpoint: Weak points visible
- [ ] Dashboard shows the dot map, feed, and modal end-to-end
- [ ] ≤1s render with 2k seeded defects
- [ ] Review with human before proceeding

### Phase 4 — Authentication (Goal G4)

#### Task 9: Google OAuth + session + domain-check middleware (C9) — F9

**Description:** Add Google OAuth/OIDC login, a session, and default-deny server
middleware gating every route; verify the email domain server-side (`hd` not
trusted alone). Swap `getReporter()` to read the real session identity so defects
record the true reporter.

**Acceptance criteria:**
- [ ] Unauthenticated requests are redirected to Google login.
- [ ] A non-`@theodo.com` verified email is denied even if `hd` claims otherwise.
- [ ] Newly filed defects record the authenticated reporter's email.

**Verification:**
- [ ] Auth test: `pnpm test -- auth` (unauth denied, wrong-domain denied)
- [ ] E2E: `pnpm e2e -- login`
- [ ] Manual: log in with a Theodo account, file a defect, confirm reporter

**Dependencies:** T1 (retrofits T5)
**Files likely touched:** `server/middleware/auth.ts`, `server/api/auth/*`, `server/utils/getReporter.ts`, `app/pages/login.vue`, `tests/auth.spec.ts`
**Estimated scope:** M

### Checkpoint: Gated & attributable
- [ ] Both views require `@theodo.com`; reporters are real
- [ ] Review with human before proceeding

### Phase 5 — Notifications (Goal G3)

#### Task 10: Web Push subscription + service worker (C10) — F8

**Description:** Generate VAPID keys; add a service worker and a "Enable
notifications" flow that subscribes the owner's device and stores the
subscription; support multiple devices; prune on HTTP 410.

**Acceptance criteria:**
- [ ] Owner can grant permission and a subscription row is stored.
- [ ] A second device adds a second subscription (both kept).
- [ ] A 410 from the push service prunes the stale subscription.

**Verification:**
- [ ] Store test: `pnpm test -- push-subscriptions`
- [ ] Manual: subscribe on the Pixel, confirm row; revoke, confirm prune

**Dependencies:** T3, T9
**Files likely touched:** `app/sw.ts`, `app/components/EnableNotifications.vue`, `server/api/subscriptions.post.ts`, `server/api/subscriptions.delete.ts`, `tests/push-subscriptions.spec.ts`
**Estimated scope:** M

#### Task 11: Send Web Push on defect filed — F7

**Description:** After the file-defect response returns (fire-and-forget, so
filing stays fast), send a VAPID Web Push to all stored subscriptions with the
section, project, and a verbatim snippet; log failures (no retry queue in v1).

**Acceptance criteria:**
- [ ] Filing a defect delivers a push to subscribed devices in ≤10s.
- [ ] The file-defect response time is unaffected by push sending.
- [ ] Push failures are logged and don't fail the request.

**Verification:**
- [ ] Send test: `pnpm test -- push-send` (mocked sender, fired post-response)
- [ ] Manual: file a defect, time the push on the Pixel

**Dependencies:** T5, T10
**Files likely touched:** `server/utils/sendPush.ts`, `server/api/defects.post.ts`, `tests/push-send.spec.ts`
**Estimated scope:** S

### Checkpoint: Owner notified
- [ ] End-to-end: file → push arrives; filing latency unaffected
- [ ] Review with human before proceeding

### Phase 6 — Ship (F10)

#### Task 12: Production image + compose + Coolify volume & domains (C11)

**Description:** Production Dockerfile; provision Coolify-managed Postgres with
scheduled backups; configure the two domains and TLS on Coolify; wire
env/secrets (`DATABASE_URL`, Google client, VAPID, session secret); run the
migration on boot. Coolify autodeploys on push to `main`, with `main`
protected by PR review + CI.

**Acceptance criteria:**
- [ ] After a redeploy, previously filed defects are still present (0 data loss).
- [ ] Both `andon.` and `dashboard.` resolve over HTTPS to the right views.
- [ ] Migrations run automatically on container start; Postgres backups scheduled.

**Verification:**
- [ ] Durability: deploy, file a defect, redeploy, confirm it persists
- [ ] Manual: both subdomains load, login works in prod
- [ ] Build: production image builds and boots

**Dependencies:** T1–T11
**Files likely touched:** `Dockerfile`, `docker-compose.yml`, `.env.example`, `server/plugins/migrate.ts`, deployment notes in `README.md`
**Estimated scope:** M

### Checkpoint: Complete
- [ ] All acceptance criteria met across G1–G4
- [ ] Critical performance budget (DESIGN §7) spot-checked
- [ ] Ready for review

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data lost on redeploy / disk failure | High | Coolify-managed Postgres with scheduled backups; redeploy durability test (T12, ADR 0003) |
| Autodeploy from `main` ships every merge | Med | Protect `main` with required PR review + CI; migrations-on-boot + healthcheck catch failures; Coolify keeps rollback (T12) |
| Google `hd` claim spoofed by a custom client | High | Server-side verified-email-domain recheck (T9) |
| Google OAuth credentials/redirect URIs unavailable | Med | `getReporter()` seam lets Phases 1–3 proceed with dev auth (T5, T9) |
| Dot map unreadable on hot Sections | Med | Visible-dot cap + "+N more" (T7) |
| Web Push subscription lost when browser storage cleared | Low | Multi-device store + easy re-subscribe (T10) |
| Two-domain routing in one Nuxt app | Med | Host-based routing decided up front; verify in T1/T7 |

## Open Questions

- **Google OAuth app:** who provisions the client ID/secret and authorized
  redirect URIs for both subdomains? Needed before T9.
- **Package manager / test tooling:** is pnpm + Vitest + Playwright the team
  standard, or should this match an existing Theodo template?
- **Coolify routing:** does Coolify terminate TLS and route both subdomains to
  one service, or do we need two service definitions pointing at the same image?
- **Notification recipients:** v1 pushes to the owner only — is "owner" a single
  account, or any subscribed `@theodo.com` user?
