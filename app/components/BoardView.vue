<script setup lang="ts">
import { ref } from 'vue'
import { board } from '~/board/definition'

defineEmits<{ select: [sectionId: string] }>()

// JS-tracked hover (rather than CSS :hover) so the highlight is observable in
// tests and can later coordinate with the dashboard dot layer.
const hoveredId = ref<string | null>(null)
</script>

<template>
  <div class="board">
    <section
      v-for="block in board"
      :key="block.id"
      class="block"
      :data-block-id="block.id"
    >
      <h2 class="block__title">{{ block.title }}</h2>
      <div class="block__columns">
        <div
          v-for="(column, columnIndex) in block.columns"
          :key="columnIndex"
          class="block__column"
        >
          <button
            v-for="section in column"
            :key="section.id"
            type="button"
            class="section"
            :class="[
              `section--${section.size.toLowerCase()}`,
              { 'is-hovered': hoveredId === section.id },
            ]"
            :data-section-id="section.id"
            @click="$emit('select', section.id)"
            @mouseenter="hoveredId = section.id"
            @mouseleave="hoveredId = null"
          >
            <span class="section__label">{{ section.label }}</span>
            <span class="section__size">{{ section.size }}</span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.board {
  display: grid;
  /* Each column hugs its widest block, blocks stretch to fill their cell, and
     the grid is centered. So the two left blocks (Value for Customer, Tech-
     Enabled) share one width and the two right blocks (Right First Time,
     Building a Learning Organisation) share another, the bottoms line up, and
     the outer silhouette stays a clean rectangle. The left column lands a touch
     under half the right — wide enough to hold its A3 sheet without forcing a
     rigid ratio. */
  grid-template-columns: max-content max-content;
  justify-content: center;
  gap: 0.75rem;
  font-family: 'Cutive Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  /* Base = A4 long side; A3/A2 derive from it by √2 so ratios stay exact.
     Tune this single value to resize the whole board. */
  --sheet-base: 220px;
}

.block {
  border: 1px solid currentColor;
  padding: 0.5rem;
}

.block__title {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.block__columns {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.block__column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px dashed currentColor;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  padding: 0.5rem;
  box-sizing: border-box;
  /* ISO 216: every A-series sheet is landscape √2 : 1 (width : height). */
  aspect-ratio: 1.41421356 / 1;
}

/* Each step up the A-series scales linear dimensions by √2 (A3 = A4·√2,
   A2 = A4·2), so the boxes keep the true relative paper sizes. */
.section--a4 { width: var(--sheet-base); }
.section--a3 { width: calc(var(--sheet-base) * 1.41421356); }
.section--a2 { width: calc(var(--sheet-base) * 2); }

.section.is-hovered {
  outline: 2px solid currentColor;
}

.section__label {
  overflow-wrap: anywhere;
  line-height: 1.2;
}

.section__size {
  align-self: flex-end;
  font-size: 0.75rem;
  opacity: 0.7;
}
</style>
