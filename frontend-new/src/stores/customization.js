import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useCustomizationStore = defineStore('customization', () => {
  // State
  const theme = ref('light')
  const compactMode = ref(false)
  const goalReminders = ref(true)
  const scheduleAlerts = ref(true)
  const weeklyReports = ref(false)

  // Load settings from localStorage on init
  const loadSettings = () => {
    const saved = localStorage.getItem('appSettings')
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        theme.value = settings.theme || 'light'
        compactMode.value = settings.compactMode || false
        goalReminders.value = settings.goalReminders !== undefined ? settings.goalReminders : true
        scheduleAlerts.value = settings.scheduleAlerts !== undefined ? settings.scheduleAlerts : true
        weeklyReports.value = settings.weeklyReports || false
      } catch (e) {
        console.error('Error loading settings:', e)
      }
    }
    applyTheme()
    applyCompactMode()
  }

  // Save settings to localStorage
  const saveSettings = () => {
    const settings = {
      theme: theme.value,
      compactMode: compactMode.value,
      goalReminders: goalReminders.value,
      scheduleAlerts: scheduleAlerts.value,
      weeklyReports: weeklyReports.value
    }
    localStorage.setItem('appSettings', JSON.stringify(settings))
  }

  // Apply theme
  const applyTheme = () => {
    const root = document.documentElement
    
    if (theme.value === 'dark') {
      root.classList.add('dark-theme')
      root.classList.remove('light-theme')
    } else if (theme.value === 'light') {
      root.classList.add('light-theme')
      root.classList.remove('dark-theme')
    } else if (theme.value === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark-theme')
        root.classList.remove('light-theme')
      } else {
        root.classList.add('light-theme')
        root.classList.remove('dark-theme')
      }
    }
  }

  // Apply compact mode
  const applyCompactMode = () => {
    const root = document.documentElement
    if (compactMode.value) {
      root.classList.add('compact-mode')
    } else {
      root.classList.remove('compact-mode')
    }
  }

  // Update theme
  const setTheme = (newTheme) => {
    theme.value = newTheme
    applyTheme()
    saveSettings()
  }

  // Update compact mode
  const setCompactMode = (value) => {
    compactMode.value = value
    applyCompactMode()
    saveSettings()
  }

  // Update notification settings
  const setGoalReminders = (value) => {
    goalReminders.value = value
    saveSettings()
  }

  const setScheduleAlerts = (value) => {
    scheduleAlerts.value = value
    saveSettings()
  }

  const setWeeklyReports = (value) => {
    weeklyReports.value = value
    saveSettings()
  }

  // Watch for auto theme changes
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (theme.value === 'auto') {
        applyTheme()
      }
    })
  }

  // Initialize
  loadSettings()

  return {
    theme,
    compactMode,
    goalReminders,
    scheduleAlerts,
    weeklyReports,
    setTheme,
    setCompactMode,
    setGoalReminders,
    setScheduleAlerts,
    setWeeklyReports,
    loadSettings,
    saveSettings
  }
})
