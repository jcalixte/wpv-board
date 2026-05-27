<script setup lang="ts">
// Defect-viewing route (`/defects`) — the read-only board with the weak-point
// map and feed. Same domain as reporting (ADR 0004).
import { sections } from '~/board/definition'

interface DefectView {
  id: string
  sectionId: string
  createdAt: string
}

// Fetch enough of the feed to fill every section's dot cap, plus the
// authoritative per-section totals that drive each "+N more" (T6).
const { data: defects } = await useFetch<DefectView[]>('/api/defects', {
  query: { limit: sections.length * 12 },
  default: () => [],
})
const { data: counts } = await useFetch<Record<string, number>>('/api/defects/counts', {
  default: () => ({}),
})
</script>

<template>
  <main class="mx-auto flex max-w-5xl flex-col items-center gap-6 p-6">
    <header class="text-center">
      <h1>Andon — weak points</h1>
      <p class="opacity-70">Every defect filed on the board.</p>
    </header>

    <DotMap :defects="defects" :counts="counts" />

    <p class="opacity-60">The defect feed and verbatim modal (T8) land next.</p>
  </main>
</template>
