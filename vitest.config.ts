import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    // Default to a plain node environment; component/integration specs opt into
    // the Nuxt runtime per-file with `// @vitest-environment nuxt`.
    environment: 'node',
  },
})
