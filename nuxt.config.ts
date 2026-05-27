// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/test-utils/module', 'nuxt-auth-utils'],
  css: ['~/assets/css/main.css'],
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
