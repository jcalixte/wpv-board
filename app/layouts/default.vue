<script setup lang="ts">
// Single domain (ADR 0004): report at `/`, view all defects at `/defects`,
// with a persistent header to move between them.
</script>

<template>
  <div class="min-h-screen">
    <header class="navbar border-base-300 border-b">
      <NuxtLink to="/" class="btn btn-ghost text-xl">Andon</NuxtLink>
      <nav class="ml-auto flex gap-1">
        <NuxtLink to="/" class="btn btn-ghost btn-sm" exact-active-class="btn-active">
          Report
        </NuxtLink>
        <NuxtLink
          to="/defects"
          class="btn btn-ghost btn-sm"
          exact-active-class="btn-active"
        >
          View defects
        </NuxtLink>
      </nav>
    </header>

    <slot />
  </div>
</template>
