# Serve one domain with routes, not two subdomains

The `/deep-design` plan served the app on two domains — `andon.apoena.dev`
(reporting) and `dashboard-andon.apoena.dev` (viewing) — with host-based routing
selecting the view. The original intent was to keep reporting clean and separate
the owner's weak-point view.

Once **every request is gated to `@theodo.com`** (F9) and **transparency** is the
goal — everyone sees the defects — that separation buys little. We serve
everything from **`andon.apoena.dev`**: `/` reports a defect (kept clean: click a
section → file) and **`/defects`** shows the weak-point map and feed, with a
header to move between them.

## Consequences

- No host-based routing in the app; the two views are plain Nuxt routes
  (`pages/index.vue`, `pages/defects.vue`) sharing one layout and nav.
- Deployment simplifies to one domain, one TLS cert, one service — this
  **resolves the open T12 question** about routing two subdomains in Coolify.
- The reporting page stays free of viewing noise; viewing lives on its own route.
- **Supersedes** the "single Nuxt app, two domains / host-based routing" decision
  in plan.md and the two-domain references in DESIGN.md / README.
