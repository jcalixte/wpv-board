<script setup lang="ts">
// The defect feed (C6, F5): every filed defect beside the board, newest-first.
// Pure presentation — the parent passes the already-ordered, bounded slice from
// `/api/defects` (T6); we don't refetch or re-sort. Each entry carries the date,
// section, project, reporter and the verbatim itself (the point of the feed).
import { sections } from '~/board/definition'

interface FeedDefect {
  id: string
  sectionId: string
  projectName: string
  reporterEmail: string
  verbatim: string
  createdAt: string | Date
}

defineProps<{ defects: FeedDefect[] }>()

const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
</script>

<template>
  <section class="flex w-full flex-col gap-3" data-test="defect-feed">
    <h2 class="text-lg font-bold">Feed</h2>

    <p v-if="defects.length === 0" class="opacity-60" data-test="feed-empty">
      No defects filed yet.
    </p>

    <ul v-else class="flex flex-col gap-2">
      <li
        v-for="defect in defects"
        :key="defect.id"
        class="border-base-300 flex flex-col gap-1 border-l-2 pl-3"
        data-test="feed-item"
      >
        <p class="text-sm">{{ defect.verbatim }}</p>
        <p class="flex flex-wrap gap-x-2 text-xs opacity-60">
          <span>{{ datestamp(defect.createdAt) }}</span>
          <span>· {{ labelFor(defect.sectionId) }}</span>
          <span>· {{ defect.projectName }}</span>
          <span>· {{ defect.reporterEmail }}</span>
        </p>
      </li>
    </ul>
  </section>
</template>
