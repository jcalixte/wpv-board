// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/test-utils/module'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
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
