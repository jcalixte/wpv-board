<script setup lang="ts">
// Single domain (ADR 0004): report at `/`, view all defects at `/defects`,
// with a persistent header to move between them.
</script>

<template>
  <div class="min-h-screen">
    <header
      class="navbar bg-base-100 border-base-300 sticky top-0 z-10 border-b px-4 shadow-sm"
    >
      <div class="navbar-start">
        <NuxtLink to="/" class="btn btn-ghost gap-2 text-xl font-semibold">
          <span class="size-2.5 rounded-full bg-[#e11d48]" aria-hidden="true" />
          Project Board Andon
        </NuxtLink>
      </div>
      <nav class="navbar-end">
        <ul class="menu menu-horizontal gap-1 px-0">
          <li>
            <NuxtLink to="/" exact-active-class="menu-active">Report</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/defects" exact-active-class="menu-active">
              View defects
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </header>

    <slot />
  </div>
</template>
