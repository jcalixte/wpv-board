# Andon — Task Checklist

Derived from [plan.md](./plan.md). Build order follows the House of Quality
weights (DESIGN.md §4). Check off as tasks complete; stop at each checkpoint for
review.

## Phase 1 — Foundation & board spine
- [x] **T1** Scaffold Nuxt 4 + tooling + Dockerised dev (M) — _deps: none_
- [x] **T2** Board-definition module (C1) + BoardView (C2) — F1 (M) — _deps: T1_
- [ ] ⛳ **Checkpoint:** build + tests pass, board interactive, human review

## Phase 2 — File a defect (G1)
- [x] **T3** Postgres schema + migrations (C8) (S) — _deps: T1_
- [x] **T4** Projects API + ProjectAutocomplete (C4) — F3 (M) — _deps: T3_
- [ ] **T5** File a defect: POST /api/defects + DefectForm (C3) — F2 (M) — _deps: T2, T3, T4_
- [ ] ⛳ **Checkpoint:** defect files end-to-end (dev auth), tests pass, human review

## Phase 3 — See weak points (G2)
- [ ] **T6** Defects read API: feed + per-section counts (C7) — F6 (M) — _deps: T3_
- [ ] **T7** Dashboard DotMap (C5) — F4 (M) — _deps: T2, T6_
- [ ] **T8** VerbatimModal + Feed (C6) — F5 (M) — _deps: T6, T7_
- [ ] ⛳ **Checkpoint:** dashboard dot map + feed + modal work, ≤1s @2k, human review

## Phase 4 — Authentication (G4)
- [ ] **T9** Google OAuth + session + domain-check middleware (C9) — F9 (M) — _deps: T1, retrofits T5_
- [ ] ⛳ **Checkpoint:** both views gated to @theodo.com, reporters real, human review

## Phase 5 — Notifications (G3)
- [ ] **T10** Web Push subscribe + service worker (C10) — F8 (M) — _deps: T3, T9_
- [ ] **T11** Send push on defect filed (fire-and-forget) — F7 (S) — _deps: T5, T10_
- [ ] ⛳ **Checkpoint:** file → push arrives ≤10s, filing latency unaffected, human review

## Phase 6 — Ship (F10)
- [ ] **T12** Prod image + Coolify managed Postgres (backups) & domains (C11) (M) — _deps: T1–T11_
- [ ] ⛳ **Checkpoint:** data survives redeploy, both subdomains live, ready for review

## Blocked on open questions (see plan.md)
- [ ] Google OAuth client provisioning (blocks T9)
- [ ] Confirm pnpm + Vitest + Playwright vs Theodo template (affects T1)
- [ ] Coolify two-domain routing model (affects T12)
- [ ] "Owner only" vs any subscribed user for push (affects T10/T11)
