<script setup lang="ts">
// Defect-viewing route (`/defects`) — the read-only board with the weak-point
// map and feed. Same domain as reporting (ADR 0004).
import { sections } from '~/board/definition'

interface DefectView {
  id: string
  sectionId: string
  projectName: string
  reporterEmail: string
  verbatim: string
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

// Which section's verbatim modal is open (null = closed). A click on any
// Section/dot in the DotMap sets it; the modal lazily loads that section (T8).
const openSection = ref<string | null>(null)
</script>

<template>
  <main class="mx-auto flex max-w-5xl flex-col items-center gap-6 p-6">
    <header class="flex flex-col items-center gap-2 text-center">
      <h1>Andon — weak points</h1>
      <p class="opacity-70">Every defect filed on the board.</p>
      <EnableNotifications />
    </header>

    <DotMap :defects="defects" :counts="counts" @select="openSection = $event" />

    <DefectFeed :defects="defects" />

    <VerbatimModal :section-id="openSection" @close="openSection = null" />
  </main>
</template>
