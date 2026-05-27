import { defineConfig } from 'vitest/config'
import { defineVitestConfig } from '@nuxt/test-utils/config'

// Two projects, split by filename:
//  • *.nuxt.spec.ts → run in the Nuxt runtime (components, anything needing
//    auto-imports or the app environment).
//  • everything else → a plain node environment. node_modules stay external,
//    so native CJS deps like `pg` load correctly (the Nuxt runtime inlines them
//    and breaks pg's internal `class … extends Pool`).
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'server',
          environment: 'node',
          include: ['tests/**/*.spec.ts'],
          exclude: ['tests/**/*.nuxt.spec.ts'],
        },
      },
      defineVitestConfig({
        test: {
          name: 'nuxt',
          environment: 'nuxt',
          include: ['tests/**/*.nuxt.spec.ts'],
        },
      }),
    ],
  },
})
