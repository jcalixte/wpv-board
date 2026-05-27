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
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
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
  /* ISO 216: every A-series sheet is portrait 1 : √2. */
  aspect-ratio: 1 / 1.41421356;
}

/* Each step up the A-series scales linear dimensions by √2 (A3 = A4·√2,
   A2 = A4·2), so the boxes keep the true relative paper sizes. */
.section--a4 { width: 120px; }
.section--a3 { width: calc(120px * 1.41421356); }
.section--a2 { width: 240px; }

.section.is-hovered {
  outline: 2px solid currentColor;
}

.section__size {
  align-self: flex-end;
  font-size: 0.75rem;
  opacity: 0.7;
}
</style>
