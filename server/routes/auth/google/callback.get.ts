import { isAllowedGoogleUser, type GoogleUserInfo } from '../../../utils/allowedGoogleUser'

// Google OAuth entry + callback (F9). nuxt-auth-utils uses one handler for
// both legs: with no `?code` it redirects to Google; on return it exchanges the
// code and hands us the verified userinfo. We then re-check the email domain
// server-side (the `hd` claim is not trusted) before minting a session.
export default defineOAuthGoogleEventHandler({
  config: {},
  async onSuccess(event, { user }) {
    const info = user as GoogleUserInfo
    if (!isAllowedGoogleUser(info)) {
      await clearUserSession(event)
      return sendRedirect(event, '/login?error=domain')
    }
    await setUserSession(event, {
      // isAllowedGoogleUser guarantees a present email; narrow for the compiler.
      user: { email: info.email!, name: user.name, picture: user.picture },
    })
    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth')
  },
})
