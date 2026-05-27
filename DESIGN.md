# Andon — Design (QFD)

Goal-driven design for the Andon weak-point app: a digital twin of the physical
Lean board where `@theodo.com` members file **Defects** about the **Board**, and
a dashboard reveals **Weak Points** via a red-dot map. This document covers the
v1 scope decided in the `/deep-design` session; it relies on [CONTEXT.md](./CONTEXT.md)
for vocabulary and [ADR 0001](./docs/adr/0001-defects-are-about-the-board-not-project-work.md)
/ [ADR 0002](./docs/adr/0002-attribution-is-transparent-not-blameless.md) for the
two contested decisions. Deferred: countermeasure lifecycle, severity, per-spot
pinning, defect titles, i18n.

Strength weights used in matrices: **9** strong, **3** medium, **1** weak, blank none.

---

## 1. Goals — the WHATs

| ID | Goal                                                                 | Weight | Source              |
|----|----------------------------------------------------------------------|:------:|---------------------|
| G1 | A team member can flag a board problem in seconds, on the board view |   10   | /deep-design session |
| G2 | The board's weak points are visible at a glance (red-dot map + feed)  |    9   | /deep-design session |
| G3 | The owner learns about a new defect promptly, on their phone          |    7   | /deep-design session |
| G4 | Only `@theodo.com` get in, and every defect is attributable           |    6   | /deep-design session, ADR 0002 |

## 2. Functions — the HOWs

| ID  | Function                                                          | Dir | Target (now)                                              |
|-----|-------------------------------------------------------------------|:---:|-----------------------------------------------------------|
| F1  | Render the canonical board from one definition (sections by ID)   |  →  | Both apps 100% from one source; layout edits never orphan defects |
| F2  | Minimize time-to-file a defect                                    |  ↓  | ≤ 3 interactions / ≤ 15s after landing on the board       |
| F3  | Suggest existing projects (creatable, deduped)                    |  ↑  | 0 retypes for known projects; new ones persisted          |
| F4  | Render the red-dot defect map legibly                             |  →  | Readable to a cap (~8–12 visible dots/section, then "+N more") |
| F5  | Show verbatim detail without leaving the board                    |  →  | Modal open/close; board stays visible                     |
| F6  | Render the dashboard quickly at expected volume                   |  ↓  | ≤ ~1s for up to ~2,000 defects                            |
| F7  | Deliver a push promptly after a defect is filed                   |  ↓  | ≤ ~10s to subscribed devices                              |
| F8  | Enroll & maintain push subscriptions                              |  →  | Multiple devices; survives re-subscribe                   |
| F9  | Gate every request behind Google SSO + server-side domain check   |  →  | 100% of routes; `hd` never trusted alone                  |
| F10 | Persist data durably across redeploys                             |  →  | 0 data loss (volume-backed SQLite)                        |

## 3. Cascade — Goals → Functions → How → Components

- **G1** Flag a board problem in seconds  _W:10_
  - **F2** Minimize time-to-file  _↓ ≤3 interactions / ≤15s_
    - **How**: click section → modal with Project select + Verbatim → submit; session keeps user logged in so no auth interstitial
      - **Component**: C2 BoardView, C3 DefectForm
  - **F3** Suggest existing projects  _↑ 0 retypes_
    - **How**: creatable autocomplete backed by a shared, case-insensitively deduped project list
      - **Component**: C4 ProjectAutocomplete, C7 server API, C8 schema
  - **F1** Render canonical board from one definition  _→ single source, stable IDs_
    - **How**: ASCII-styled DOM grid driven by one board-definition module (rejected: literal ASCII+overlays, SVG — see T1)
      - **Component**: C1 board-definition, C2 BoardView
- **G2** Weak points visible at a glance  _W:9_
  - **F4** Render red-dot map legibly  _→ cap ~8–12 + "+N more"_
    - **How**: dots absolutely positioned inside each section box; diagonal date labels; overflow collapses to a "+N more" marker
      - **Component**: C5 DotMap
  - **F5** Show verbatim without leaving the board  _→ modal_
    - **How**: click a section/dot → modal lists that section's defects (date, project, reporter, verbatim); a reverse-chronological feed sits alongside
      - **Component**: C6 VerbatimModal + Feed
  - **F6** Dashboard renders quickly  _↓ ≤1s @2k defects_
    - **How**: server returns per-section counts + a bounded recent slice; full section history fetched lazily on modal open
      - **Component**: C7 server API, C8 schema
- **G3** Owner notified promptly on phone  _W:7_
  - **F7** Deliver push ≤10s after filing  _↓_
    - **How**: VAPID Web Push, sent fire-and-forget *after* the file response returns (so it never slows F2); failures logged, not retried (no queue in v1 — see T8)
      - **Component**: C10 WebPush sender + service worker
  - **F8** Enroll & maintain subscriptions  _→ multi-device_
    - **How**: owner grants notification permission on the Pixel (PWA); subscription rows stored as a list; stale subs pruned on 410
      - **Component**: C10, C8 schema
- **G4** Theodo-only + attributable  _W:6_
  - **F9** Gate every request behind Google SSO  _→ 100% routes_
    - **How**: Google OAuth/OIDC; server-side verified-email-domain check (`hd` not trusted alone); default-deny middleware
      - **Component**: C9 Auth middleware
  - **F10** Persist durably across redeploys  _→ 0 loss_
    - **How**: SQLite file on a Coolify persistent volume (rejected: Postgres container — see T5)
      - **Component**: C8 schema, C11 deploy

## 4. House — Functions × Goals (transposed for width)

Cells: link strength (9/3/1/blank). Importance = `Σ(goal weight × strength)`.

| Function | G1 (10) | G2 (9) | G3 (7) | G4 (6) | **Importance** |
|----------|:-------:|:------:|:------:|:------:|:--------------:|
| F1 | 3 | 9 |   |   | **111** |
| F2 | 9 |   |   |   | **90** |
| F3 | 9 |   |   |   | **90** |
| F4 |   | 9 |   |   | **81** |
| F5 |   | 9 |   |   | **81** |
| F6 |   | 3 |   |   | **27** |
| F7 |   |   | 9 |   | **63** |
| F8 |   |   | 9 |   | **63** |
| F9 |   |   |   | 9 | **54** |
| F10 |   | 3 |   | 1 | **33** |

**Top engineering priorities:** F1 (111) is the spine — every view and the dot map depend on the single board definition, so it gets built and tested first. F2/F3 (90 each) are the frictionless-filing pair that makes data exist at all. F4/F5 (81) are the weak-point payoff. F6/F10 are low-weight but cheap insurance; don't gold-plate them.

## 5. Roof — Function × Function tensions

`◎` strong reinforce · `○` mild reinforce · `×` mild conflict · `⊗` strong conflict.

|        | F1 | F2 | F4 | F6 | F7 | F9 |
|--------|:--:|:--:|:--:|:--:|:--:|:--:|
| **F1** | — | ○ | ◎ |   |   |   |
| **F2** |   | — |   |   | × | × |
| **F4** |   |   | — | × |   |   |
| **F6** |   |   |    | — |   |   |
| **F7** |   |    |   |   | — |   |
| **F9** |   |   |   |   |   | — |

**Conflicts that actually shape the design:**
- **F2 × F9 (fast filing vs auth gate).** The SSO redirect is friction. Mitigated by a persistent session cookie so the gate is invisible after first login. Owned by ADR is unnecessary; standard.
- **F2 × F7 (fast filing vs push).** Sending push inside the file request would slow the submit. Mitigated by firing the push *after* the response returns (fire-and-forget).
- **F4 × F6 (rich dot map vs fast dashboard).** Rendering every dot+label is heavy. Mitigated by the visible-dot cap + server-side per-section counts.
- **F1 ◎ F4.** The single board definition with stable section IDs is what lets dots land in the right place forever — strong reinforcement, build F1 right and F4 gets easier.

## 6. Components & Function → Component map

| ID  | Component                                             | ADR     |
|-----|-------------------------------------------------------|---------|
| C1  | Board-definition module (blocks, sections, stable IDs, sizes, grid placement) | — |
| C2  | BoardView (shared ASCII-styled grid; hover/click)     | —       |
| C3  | DefectForm (modal: Project + Verbatim)                | —       |
| C4  | ProjectAutocomplete (creatable, deduped)              | —       |
| C5  | DotMap (dots + diagonal dates + "+N more")            | —       |
| C6  | VerbatimModal + reverse-chronological Feed            | ADR 0002 |
| C7  | Nuxt/Nitro server API (defects, projects, subs)       | ADR 0001 |
| C8  | SQLite + Drizzle schema (defects, projects, push_subscriptions) | ADR 0001 |
| C9  | Google OAuth + session + domain-check middleware      | —       |
| C10 | Web Push sender (VAPID) + service worker + sub store  | —       |
| C11 | Docker image + compose + Coolify volume mount         | —       |

| Function | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 |
|----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|:---:|
| F1 | 9 | 9 |   |   |   |   |   |   |   |   |   |
| F2 |   | 9 | 9 | 3 |   |   | 3 |   |   |   |   |
| F3 |   |   | 3 | 9 |   |   | 3 | 3 |   |   |   |
| F4 | 3 | 3 |   |   | 9 |   |   |   |   |   |   |
| F5 |   | 3 |   |   |   | 9 | 3 |   |   |   |   |
| F6 |   |   |   |   |   | 3 | 9 | 9 |   |   |   |
| F7 |   |   |   |   |   |   | 3 |   |   | 9 |   |
| F8 |   |   |   |   |   |   | 3 | 3 |   | 9 |   |
| F9 |   |   |   |   |   |   | 3 |   | 9 |   |   |
| F10|   |   |   |   |   |   |   | 9 |   |   | 9 |

## 7. Critical performance budget

| Rank | Function | Target | Watched on | If we miss it |
|------|----------|--------|------------|---------------|
| 1 | F2 time-to-file | ≤3 interactions / ≤15s | Manual click-through; interaction count in review | Pre-select project from the reporter's last use; drop a field |
| 2 | F1 board fidelity | Both apps from one module | Snapshot test on the rendered board; both apps import C1 | CI snapshot diff fails the build |
| 3 | F9 auth coverage | 100% of routes gated | Integration test hitting routes unauthenticated | Default-deny middleware; block deploy if a route leaks |
| 4 | F4 dot legibility | Readable to the cap | Seed N defects on one section, eyeball | Lower the visible-dot cap / tighten "+N more" threshold |
| 5 | F7 push latency | ≤10s to device | File a defect, time the phone | Accept the delay; show an in-app unread badge as fallback (no retry queue) |
| 6 | F6 dashboard render | ≤1s @ ~2k defects | Seed 2k rows, measure render | Add index on (section_id, created_at); precompute section counts |
| 7 | F10 durability | 0 data loss on redeploy | Redeploy on Coolify, verify data present | Confirm volume mount; block launch until verified |

## 8. Tradeoffs — Got / Paid / ADR

| ID | Tradeoff | Got | Paid | ADR |
|----|----------|-----|------|-----|
| T1 | ASCII-styled DOM grid over literal ASCII text / SVG | Trivial hit-zones, dot placement, hover, responsiveness | Not byte-authentic text-art | — |
| T2 | Append-only log over lifecycle | Trivial model, fast v1 | No countermeasure/close tracking (deferred) | — |
| T3 | Transparent attribution over blameless | Accountability + follow-up path | Cultural risk of chilled reporting | ADR 0002 |
| T4 | Defect = board artifact over project-work classification | Board-as-product weak-point analysis | Can't capture project-level problems (different concept) | ADR 0001 |
| T5 | SQLite over Postgres | Zero-ops, single container | Must mount a persistent volume; single-writer; manual backups | — |
| T6 | Web Push over Slack/email | No third-party dependency; native phone push | Subscription management; breaks if browser storage cleared | — |
| T7 | Section-level pin over exact-spot | Simpler model | Dot positions cosmetic; precise location lost | — |
| T8 | Fire-and-forget push, no queue | Filing stays fast; minimal infra | Push is best-effort, not retried on failure | — |

### Tensions being watched (unresolved by design)

- **Transparent attribution may chill reporting.** Shipping it as-is. **Trigger to revisit:** low defect volume or visibly guarded verbatims in the first weeks → revert to hiding the Reporter (display-only change; data already captured).
- **Append-only log vs the urge to act on weak points.** No status tracking in v1. **Trigger:** defects accumulate with no way to mark them addressed → add lifecycle (status + countermeasure).
- **Dot cap hides data on hot sections.** Cap + "+N more" for now. **Trigger:** users routinely miss detail behind the cap → add a section zoom/detail view.
- **No retry queue for push.** Fire-and-forget. **Trigger:** push reliability becomes important or volume grows → add a background job.

## 9. Inconsistencies spotted and fixed

- **"issue / problem / defect / weak point" used interchangeably in the brief.** Resolved in CONTEXT.md: a single report is a **Defect**; a **Section** that accumulates defects is a **Weak Point**.
- **Brief framed Andon as flagging project problems (Reading A); owner meant the board artifact (Reading B).** Resolved in ADR 0001.
- **"push notification" was ambiguous (Web Push vs Slack/email).** Resolved to true Web Push, justified by the owner's Android Pixel and the no-third-party preference.
- **"list of defects by desc order" was ambiguous (newest-first vs section-by-count).** Resolved to a reverse-chronological feed; section ranking is conveyed by dot density instead.

---

## How to keep this honest

- When a new ADR lands → add its components to §6 and re-score affected rows.
- When a spike / measurement returns numbers → update §7 `Target` / `Watched on`.
- WHATs (§1) change rarely; HOWs (§2) change with each release; matrices (§§4–6) are recomputed when either side changes.
- The matrices have upkeep cost — if this stays a small internal tool, it is fine to let §§4–5 go stale and treat §3 + §7 + §8 as the living core. Delete any section that becomes empty.
