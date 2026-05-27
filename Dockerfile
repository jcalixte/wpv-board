# syntax=docker/dockerfile:1

# --- Build stage: install deps and produce the Nuxt/Nitro output ---
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
# Cache the pnpm store across builds so dependencies aren't re-downloaded on
# every source change. Source is copied first because the root `postinstall`
# (nuxt prepare) needs it.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
RUN pnpm build

# --- Runtime stage: minimal image running the built server ---
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0
# Built server plus the migration SQL, which a Nitro plugin applies on boot.
COPY --from=build --chown=node:node /app/.output ./.output
COPY --from=build --chown=node:node /app/server/db/migrations ./server/db/migrations
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1 || exit 1
CMD ["node", ".output/server/index.mjs"]
