<script setup lang="ts">
// Login gate (F9). Standalone (no app header — its nav points at gated routes).
// The button is a real anchor so it hits the server OAuth route directly.
definePageMeta({ layout: false })

const route = useRoute()
const error = computed(() => {
  if (route.query.error === 'domain') return 'Sign in with your @theodo.com Google account.'
  if (route.query.error === 'oauth') return 'Sign-in failed — please try again.'
  return null
})
</script>

<template>
  <main class="flex min-h-screen items-center justify-center p-6">
    <div class="card bg-base-100 border-base-300 w-full max-w-sm border shadow-sm">
      <div class="card-body items-center text-center gap-4">
        <h1 class="flex items-center gap-2 text-2xl font-semibold">
          <span class="size-2.5 rounded-full bg-[#e11d48]" aria-hidden="true" />
          Project Board Andon
        </h1>
        <p class="opacity-70">Sign in to report and view board defects.</p>

        <p v-if="error" role="alert" class="alert alert-error text-sm">{{ error }}</p>

        <a href="/auth/google/callback" class="btn btn-primary w-full">
          Sign in with Google
        </a>
      </div>
    </div>
  </main>
</template>
