<script setup>
import { ref, onMounted, defineExpose } from 'vue'

const emit = defineEmits([
  'install-available',
  'update-available',
  'app-installed',
  'online',
  'offline'
])

const registration = ref(null)
const updateAvailable = ref(false)
const isOnline = ref(navigator.onLine)
const deferredPrompt = ref(null)
const canInstall = ref(false)

const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Register service worker
      const reg = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      })

      registration.value = reg

      console.log('[PWA] Service Worker registered successfully:', reg)

      // Check for updates every hour
      setInterval(() => {
        reg.update()
      }, 3600000)

      // Listen for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            updateAvailable.value = true
            emit('update-available')
            showUpdateNotification()
          }
        })
      })

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (updateAvailable.value) {
          window.location.reload()
        }
      })

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error)
    }
  } else {
    console.log('[PWA] Service Worker not supported')
  }
}

const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] Install prompt available')
    e.preventDefault()
    deferredPrompt.value = e
    canInstall.value = true
    emit('install-available')
  })

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully')
    deferredPrompt.value = null
    canInstall.value = false
    emit('app-installed')
  })
}

const installApp = async () => {
  if (!deferredPrompt.value) {
    console.log('[PWA] Install prompt not available')
    return false
  }

  // Show install prompt
  deferredPrompt.value.prompt()

  // Wait for user response
  const { outcome } = await deferredPrompt.value.userChoice
  console.log('[PWA] User choice:', outcome)

  deferredPrompt.value = null
  canInstall.value = false

  return outcome === 'accepted'
}

const showUpdateNotification = () => {
  // You can customize this notification
  if (window.confirm('A new version is available! Would you like to update now?')) {
    applyUpdate()
  }
}

const applyUpdate = () => {
  if (!registration.value || !registration.value.waiting) return

  // Tell the service worker to skip waiting
  registration.value.waiting.postMessage({ action: 'skipWaiting' })
}

const setupOnlineOfflineHandlers = () => {
  window.addEventListener('online', () => {
    console.log('[PWA] Back online')
    isOnline.value = true
    emit('online')
  })

  window.addEventListener('offline', () => {
    console.log('[PWA] Gone offline')
    isOnline.value = false
    emit('offline')
  })
}

const clearCache = () => {
  if (registration.value) {
    registration.value.active.postMessage({ action: 'clearCache' })
  }
}

// Expose methods to parent component
defineExpose({
  installApp,
  applyUpdate,
  clearCache
})

onMounted(() => {
  registerServiceWorker()
  setupInstallPrompt()
  setupOnlineOfflineHandlers()
})
</script>
