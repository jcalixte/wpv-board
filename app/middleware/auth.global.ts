// Redirect unauthenticated visitors to the login page, and bounce already
// logged-in users away from it (F9). Runs on both SSR and client navigations;
// the server data API is gated independently in server/middleware/auth.ts.
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value && to.path !== '/login') {
    return navigateTo('/login')
  }
  if (loggedIn.value && to.path === '/login') {
    return navigateTo('/')
  }
})
