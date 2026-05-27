<script setup lang="ts">
// Defect-viewing route (`/defects`) — the read-only board with the weak-point
// map and feed. Same domain as reporting (ADR 0004).
</script>

<template>
  <main class="mx-auto flex max-w-5xl flex-col items-center gap-6 p-6">
    <header class="text-center">
      <h1>Andon — weak points</h1>
      <p class="opacity-70">Every defect filed on the board.</p>
    </header>

    <BoardView />

    <p class="opacity-60">The red-dot map (T7) and defect feed (T8) land next.</p>
  </main>
</template>
