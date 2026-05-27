<script setup lang="ts">
// Owner-only Web Push enrolment (T10/F8). Renders nothing unless the signed-in
// user is the configured owner. Registers the service worker, subscribes the
// device with the public VAPID key, and stores the subscription server-side;
// turning it off unsubscribes and prunes the row.
const { user } = useUserSession()
const config = useRuntimeConfig()
const ownerEmail = config.public.ownerEmail
const vapidPublicKey = config.public.vapidPublicKey

const isOwner = computed(
  () =>
    !!user.value?.email &&
    !!ownerEmail &&
    user.value.email.toLowerCase() === ownerEmail.toLowerCase(),
)

type State = 'loading' | 'idle' | 'subscribed' | 'denied' | 'unsupported' | 'misconfigured'
const state = ref<State>('loading')
const busy = ref(false)

const supported = () =>
  import.meta.client &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

onMounted(async () => {
  if (!isOwner.value) return
  if (!supported()) return void (state.value = 'unsupported')
  if (!vapidPublicKey) return void (state.value = 'misconfigured')
  if (Notification.permission === 'denied') return void (state.value = 'denied')

  const reg = await navigator.serviceWorker.getRegistration()
  const existing = await reg?.pushManager.getSubscription()
  state.value = existing ? 'subscribed' : 'idle'
})

async function enable() {
  busy.value = true
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      state.value = permission === 'denied' ? 'denied' : 'idle'
      return
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })
    await $fetch('/api/subscriptions', { method: 'POST', body: sub.toJSON() })
    state.value = 'subscribed'
  } finally {
    busy.value = false
  }
}

async function disable() {
  busy.value = true
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    if (sub) {
      await $fetch('/api/subscriptions', { method: 'DELETE', body: { endpoint: sub.endpoint } })
      await sub.unsubscribe()
    }
    state.value = 'idle'
  } finally {
    busy.value = false
  }
}

// VAPID public keys are URL-safe base64; PushManager wants the raw bytes,
// backed by a concrete ArrayBuffer to satisfy the BufferSource type.
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const normalised = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(normalised)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}
</script>

<template>
  <div v-if="isOwner" class="text-sm">
    <div v-if="state === 'subscribed'" class="flex items-center gap-2">
      <span class="opacity-70">🔔 Notifications on</span>
      <button type="button" class="btn btn-ghost btn-xs" :disabled="busy" @click="disable">
        Turn off
      </button>
    </div>
    <button
      v-else-if="state === 'idle'"
      type="button"
      class="btn btn-outline btn-sm"
      :disabled="busy"
      @click="enable"
    >
      Enable notifications
    </button>
    <p v-else-if="state === 'denied'" class="opacity-60">
      Notifications are blocked in your browser settings.
    </p>
    <p v-else-if="state === 'unsupported'" class="opacity-60">
      This browser can’t receive push notifications.
    </p>
    <p v-else-if="state === 'misconfigured'" class="opacity-60">
      Push notifications aren’t configured.
    </p>
  </div>
</template>
