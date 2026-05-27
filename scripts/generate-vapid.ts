// One-off helper to mint a VAPID key pair for Web Push (T10).
// Run with `pnpm vapid:keys`, then paste the values into your .env:
//   NUXT_PUBLIC_VAPID_PUBLIC_KEY (sent to the browser)
//   NUXT_VAPID_PRIVATE_KEY        (server secret — never expose)
import webpush from 'web-push'

const { publicKey, privateKey } = webpush.generateVAPIDKeys()

console.log('NUXT_PUBLIC_VAPID_PUBLIC_KEY=' + publicKey)
console.log('NUXT_VAPID_PRIVATE_KEY=' + privateKey)
