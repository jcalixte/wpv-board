// Shape of the authenticated session for nuxt-auth-utils (Task 9, F9).
// Lives in shared/ so both the app and server TS projects pick up the
// #auth-utils augmentation.
declare module '#auth-utils' {
  interface User {
    email: string
    name?: string
    picture?: string
  }
}

export {}
