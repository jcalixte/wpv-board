// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/test-utils/module', 'nuxt-auth-utils'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // VAPID private key + subject for signing Web Push (server-only, T11).
    vapidPrivateKey: '', // NUXT_VAPID_PRIVATE_KEY
    vapidSubject: '', // NUXT_VAPID_SUBJECT
    public: {
      // VAPID public key the browser subscribes with (T10).
      vapidPublicKey: '', // NUXT_PUBLIC_VAPID_PUBLIC_KEY
      // The single owner allowed to enrol for push (G3). Not secret; gates both
      // the server enrol endpoint and the client-side "Enable" button.
      ownerEmail: '', // NUXT_PUBLIC_OWNER_EMAIL
    },
  },
  // Tailwind v4 integrates as a Vite plugin (no @nuxtjs/tailwindcss module).
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      // DaisyUI theme is selected via data-theme on the root element.
      htmlAttrs: { 'data-theme': 'light' },
      link: [
        { rel: 'preconnect', href: 'https://api.fonts.coollabs.io' },
        {
          rel: 'stylesheet',
          href: 'https://api.fonts.coollabs.io/css2?family=Cutive+Mono&family=Playfair+Display:wght@400;700;800&display=swap',
        },
      ],
    },
  },
})
