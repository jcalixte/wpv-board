<script setup lang="ts">
// The weak-point dot map (C5, F4): overlays each defect as a red dot inside its
// Section box with a diagonal date label. Visible dots are capped (~8–12) and
// the remainder collapses to a "+N more" marker, so a hot Section stays legible
// (DESIGN §5, ADR T7 — dot positions are cosmetic; the Section is the pin).
//
// Reuses BoardView (C2) via its `overlay` slot, and the feed + per-section
// counts from T6: `defects` are the newest-first feed slice (bounded), `counts`
// the true per-section totals that drive the "+N more" arithmetic.
interface DotDefect {
  id: string
  sectionId: string
  createdAt: string | Date
}

const props = defineProps<{
  defects: DotDefect[]
  counts: Record<string, number>
  cap?: number
}>()

const cap = computed(() => props.cap ?? 10)

// Group the feed by section, preserving its newest-first order.
const bySection = computed(() => {
  const map: Record<string, DotDefect[]> = {}
  for (const d of props.defects) (map[d.sectionId] ??= []).push(d)
  return map
})

const dotsFor = (id: string) => (bySection.value[id] ?? []).slice(0, cap.value)

// Hidden defects = true total (counts, authoritative) minus what we drew.
function overflowFor(id: string): number {
  const total = props.counts[id] ?? bySection.value[id]?.length ?? 0
  return Math.max(0, total - dotsFor(id).length)
}

// Compact, locale-free date stamp (DD/MM, UTC) for the diagonal label.
function formatDate(value: string | Date): string {
  const d = new Date(value)
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}

// Cosmetic scatter: a stable 5-wide grid in fixed units (ADR T7), so dots
// cluster the same way in every section regardless of paper size (A2/A3/A4)
// rather than spreading out in the larger boxes.
function dotStyle(index: number) {
  return {
    left: `${1.1 + (index % 5) * 1.5}rem`,
    top: `${2 + Math.floor(index / 5) * 2.6}rem`,
  }
}
</script>

<template>
  <BoardView>
    <template #overlay="{ sectionId }">
      <span
        v-for="(defect, index) in dotsFor(sectionId)"
        :key="defect.id"
        class="dot"
        :style="dotStyle(index)"
        data-test="dot"
      >
        <span class="dot__date">{{ formatDate(defect.createdAt) }}</span>
      </span>

      <span v-if="overflowFor(sectionId) > 0" class="dot-more" data-test="more">
        +{{ overflowFor(sectionId) }} more
      </span>
    </template>
  </BoardView>
</template>

<style scoped>
.dot {
  position: absolute;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: #e11d48;
  /* Centre the dot on its grid point so labels splay outward consistently. */
  transform: translate(-50%, -50%);
}

.dot__date {
  position: absolute;
  /* Anchored just under the dot, splaying diagonally down-right. */
  top: 0.5rem;
  left: 0.85rem;
  font-size: 0.6rem;
  line-height: 1;
  white-space: nowrap;
  transform: rotate(45deg);
  transform-origin: top left;
}

.dot-more {
  position: absolute;
  /* Bottom-left, clear of the A2/A3/A4 size label at the bottom-right. */
  left: 0.4rem;
  bottom: 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: #e11d48;
}
</style>
