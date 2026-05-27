<script setup lang="ts">
const selected = ref<string | null>(null)
</script>

<template>
  <main>
    <h1>Andon — report a board problem</h1>
    <BoardView @select="(id) => (selected = id)" />
    <p v-if="selected">
      Selected section: <code>{{ selected }}</code> — the defect form arrives in Task 5.
    </p>
  </main>
</template>
