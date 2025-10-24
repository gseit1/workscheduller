<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>Settings</h1>
      <p>Customize your application preferences</p>
    </div>

    <div class="settings-content">
      <div class="settings-card">
        <h3>Appearance</h3>
        
        <div class="setting-item">
          <div class="setting-info">
            <h4>Theme</h4>
            <p>Choose your preferred color scheme</p>
          </div>
          <select v-model="theme" @change="onThemeChange" class="form-select">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <h4>Compact Mode</h4>
            <p>Reduce spacing for a denser layout</p>
          </div>
          <label class="toggle">
            <input v-model="compactMode" @change="onCompactModeChange" type="checkbox" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-card">
        <h3>Notifications</h3>
        
        <div class="setting-item">
          <div class="setting-info">
            <h4>Goal Reminders</h4>
            <p>Get notified about upcoming goal deadlines</p>
          </div>
          <label class="toggle">
            <input v-model="goalReminders" @change="onGoalRemindersChange" type="checkbox" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <h4>Work Schedule Alerts</h4>
            <p>Receive alerts for scheduled work days</p>
          </div>
          <label class="toggle">
            <input v-model="scheduleAlerts" @change="onScheduleAlertsChange" type="checkbox" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <h4>Weekly Reports</h4>
            <p>Get weekly summary of your work and earnings</p>
          </div>
          <label class="toggle">
            <input v-model="weeklyReports" @change="onWeeklyReportsChange" type="checkbox" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-card app-card">
        <h3>Application</h3>
        
        <div class="setting-item">
          <div class="setting-info">
            <h4>
              <i class="bi bi-app-indicator"></i>
              Install as App
            </h4>
            <p v-if="isInstalled">
              ✅ App is already installed on your device
            </p>
            <p v-else-if="canInstall">
              Install Job Analytics for quick access and offline use
            </p>
            <p v-else>
              📱 Install the app on your device for the best experience:
              <br><br>
              <strong>Desktop (Chrome/Edge):</strong><br>
              • Click the install icon <i class="bi bi-download"></i> in the address bar<br>
              • Or use menu → Install Job Analytics<br><br>
              <strong>Mobile (Chrome):</strong><br>
              • Tap menu (⋮) → Add to Home screen<br><br>
              <strong>iOS (Safari):</strong><br>
              • Tap Share <i class="bi bi-share"></i> → Add to Home Screen
            </p>
          </div>
          <button 
            v-if="canInstall && !isInstalled" 
            @click="installPWA" 
            class="btn btn-primary btn-install-app"
          >
            <i class="bi bi-download"></i>
            Install Now
          </button>
          <div v-else-if="isInstalled" class="app-installed-badge">
            <i class="bi bi-check-circle-fill"></i>
            Installed
          </div>
        </div>
        
        <div class="app-features">
          <h5>App Features:</h5>
          <ul>
            <li><i class="bi bi-lightning-charge-fill"></i> Faster load times</li>
            <li><i class="bi bi-wifi-off"></i> Works offline</li>
            <li><i class="bi bi-bell-fill"></i> Push notifications</li>
            <li><i class="bi bi-phone-fill"></i> Native app experience</li>
          </ul>
        </div>
      </div>

      <div class="settings-card">
        <h3>Data & Privacy</h3>
        
        <div class="setting-item">
          <div class="setting-info">
            <h4>Export Data</h4>
            <p>Download all your data in JSON format</p>
          </div>
          <button @click="exportData" class="btn btn-secondary">
            <i class="bi bi-download"></i>
            Export
          </button>
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <h4>Clear Cache</h4>
            <p>Clear application cache and temporary data</p>
          </div>
          <button @click="clearCache" class="btn btn-outline-secondary">
            <i class="bi bi-trash"></i>
            Clear
          </button>
        </div>
      </div>

      <div class="settings-card danger-zone">
        <h3>Danger Zone</h3>
        
        <div class="setting-item">
          <div class="setting-info">
            <h4>Delete Account</h4>
            <p>Permanently delete your account and all data</p>
          </div>
          <button @click="deleteAccount" class="btn btn-danger">
            <i class="bi bi-exclamation-triangle"></i>
            Delete Account
          </button>
        </div>
      </div>

      <div class="settings-actions">
        <button @click="saveSettings" class="btn btn-primary btn-lg">
          <i class="bi bi-check-circle"></i>
          Save Settings
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useToast } from 'vue-toastification'
import { useCustomizationStore } from '../stores/customization'

const toast = useToast()
const customizationStore = useCustomizationStore()

// PWA Install state
const canInstall = ref(false)
const isInstalled = ref(false)
const deferredPrompt = ref(null)

// Check if app is installed
onMounted(() => {
  // Check if running in standalone mode (installed)
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    isInstalled.value = true
  }

  // Listen for install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    canInstall.value = true
  })

  // Listen for app installed
  window.addEventListener('appinstalled', () => {
    isInstalled.value = true
    canInstall.value = false
    deferredPrompt.value = null
  })
})

// Direct refs to store values
const theme = computed({
  get: () => customizationStore.theme,
  set: (value) => customizationStore.setTheme(value)
})

const compactMode = computed({
  get: () => customizationStore.compactMode,
  set: (value) => customizationStore.setCompactMode(value)
})

const goalReminders = computed({
  get: () => customizationStore.goalReminders,
  set: (value) => customizationStore.setGoalReminders(value)
})

const scheduleAlerts = computed({
  get: () => customizationStore.scheduleAlerts,
  set: (value) => customizationStore.setScheduleAlerts(value)
})

const weeklyReports = computed({
  get: () => customizationStore.weeklyReports,
  set: (value) => customizationStore.setWeeklyReports(value)
})

// Change handlers
const onThemeChange = () => {
  toast.success(`Theme changed to ${theme.value}`)
}

const onCompactModeChange = () => {
  toast.success(`Compact mode ${compactMode.value ? 'enabled' : 'disabled'}`)
}

const onGoalRemindersChange = () => {
  toast.success(`Goal reminders ${goalReminders.value ? 'enabled' : 'disabled'}`)
}

const onScheduleAlertsChange = () => {
  toast.success(`Schedule alerts ${scheduleAlerts.value ? 'enabled' : 'disabled'}`)
}

const onWeeklyReportsChange = () => {
  toast.success(`Weekly reports ${weeklyReports.value ? 'enabled' : 'disabled'}`)
}

// PWA Install handler
const installPWA = async () => {
  if (!deferredPrompt.value) {
    toast.error('Installation is not available at this time')
    return
  }

  try {
    // Show the install prompt
    deferredPrompt.value.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.value.userChoice
    
    if (outcome === 'accepted') {
      toast.success('Thanks for installing Job Analytics! 🎉')
      canInstall.value = false
      isInstalled.value = true
    } else {
      toast.info('Installation cancelled')
    }

    // Clear the deferred prompt
    deferredPrompt.value = null
  } catch (error) {
    console.error('Error during installation:', error)
    toast.error('Failed to install app')
  }
}

const saveSettings = () => {
  customizationStore.saveSettings()
  toast.success('Settings saved successfully!')
}

const exportData = async () => {
  try {
    toast.info('Preparing your data export...')
    
    // In a real implementation, you would fetch all user data from API
    const userData = {
      exportDate: new Date().toISOString(),
      settings: {
        theme: theme.value,
        compactMode: compactMode.value,
        goalReminders: goalReminders.value,
        scheduleAlerts: scheduleAlerts.value,
        weeklyReports: weeklyReports.value
      },
      message: 'Data export functionality to be implemented'
    }
    
    const dataStr = JSON.stringify(userData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('Data exported successfully!')
  } catch (error) {
    toast.error('Failed to export data')
  }
}

const clearCache = () => {
  try {
    localStorage.removeItem('appCache')
    sessionStorage.clear()
    toast.success('Cache cleared successfully!')
  } catch (error) {
    toast.error('Failed to clear cache')
  }
}

const deleteAccount = () => {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    toast.error('Account deletion feature not implemented yet')
    // TODO: Implement account deletion via API
  }
}
</script>

<style lang="scss" scoped>
.settings-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-xl);
  
  h1 {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }
  
  p {
    color: var(--text-secondary);
  }
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.settings-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  
  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-sm);
    border-bottom: 2px solid var(--border-color);
  }
  
  &.danger-zone {
    border: 2px solid var(--danger);
    
    h3 {
      color: var(--danger);
      border-color: var(--danger);
    }
  }
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .setting-info {
    flex: 1;
    
    h4 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--spacing-xs);
    }
    
    p {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0;
    }
  }
  
  .form-select {
    width: 150px;
  }
}

.toggle {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
    
    &:checked + .toggle-slider {
      background: var(--primary);
      
      &:before {
        transform: translateX(26px);
      }
    }
  }
  
  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-secondary);
    border: 2px solid var(--border-color);
    border-radius: 34px;
    transition: 0.3s;
    
    &:before {
      content: '';
      position: absolute;
      height: 24px;
      width: 24px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
      box-shadow: var(--shadow-sm);
    }
  }
}

.settings-actions {
  padding-top: var(--spacing-lg);
}

// App Installation Card
.app-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  border: 2px solid rgba(99, 102, 241, 0.2);

  .setting-info {
    h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1rem;
      color: #6366f1;

      i {
        font-size: 1.2rem;
      }
    }

    p {
      line-height: 1.6;
      
      strong {
        color: var(--text-primary);
        font-weight: 600;
      }

      i {
        color: #6366f1;
      }
    }
  }

  .btn-install-app {
    min-width: 140px;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 700;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border: none;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
    }
  }

  .app-installed-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;

    i {
      font-size: 18px;
    }
  }

  .app-features {
    margin-top: var(--spacing-lg);
    padding: var(--spacing-md);
    background: rgba(255, 255, 255, 0.5);
    border-radius: var(--radius-md);
    border: 1px solid rgba(99, 102, 241, 0.1);

    h5 {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-sm);

      li {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
        color: var(--text-secondary);

        i {
          color: #6366f1;
          font-size: 1rem;
        }
      }
    }
  }
}

html.dark-theme .app-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-color: rgba(99, 102, 241, 0.3);

  .app-features {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(99, 102, 241, 0.2);
  }
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 1.5rem;
  }
  
  .settings-card {
    padding: var(--spacing-lg);
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
    
    .form-select {
      width: 100%;
    }
  }

  .app-card .app-features ul {
    grid-template-columns: 1fr;
  }
}
</style>
