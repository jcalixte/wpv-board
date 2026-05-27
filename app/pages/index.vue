<script setup lang="ts">
// Andon reporting view (F2): the board is the entry point — clicking a section
// opens the defect form for it.
const selectedSectionId = ref<string | null>(null)
const confirmation = ref<string | null>(null)

function onFiled() {
  selectedSectionId.value = null
  confirmation.value = 'Thanks — your report was filed.'
  setTimeout(() => (confirmation.value = null), 4000)
}
</script>

<template>
  <main class="mx-auto flex max-w-5xl flex-col items-center gap-6 p-6">
    <header class="text-center">
      <h1>Andon — report a board problem</h1>
      <p class="opacity-70">Click a section to report a problem.</p>
    </header>

    <BoardView @select="(id) => (selectedSectionId = id)" />

    <DefectForm
      :section-id="selectedSectionId"
      @close="selectedSectionId = null"
      @filed="onFiled"
    />

    <div v-if="confirmation" class="toast toast-end">
      <div class="alert alert-success">{{ confirmation }}</div>
    </div>
  </main>
</template>
