<template>
  <div id="app" :class="['app-container', { 'sidebar-open': sidebarOpen }]">
    <!-- PWA Manager -->
    <PWAManager
      ref="pwaManager"
      @install-available="onInstallAvailable"
      @update-available="onUpdateAvailable"
      @app-installed="onAppInstalled"
      @online="onOnline"
      @offline="onOffline"
    />

    <!-- PWA Prompts -->
    <PWAPrompts
      :can-install="canInstall"
      :is-online="isOnline"
      :update-available="updateAvailable"
      @install="installApp"
      @update="applyUpdate"
    />

    <!-- Mobile Header -->
    <header class="mobile-header" v-if="isAuthenticated">
      <button class="menu-toggle" @click="toggleSidebar" aria-label="Toggle menu">
        <i class="bi" :class="sidebarOpen ? 'bi-x' : 'bi-list'"></i>
      </button>
      <div class="mobile-logo">
        <i class="bi bi-graph-up-arrow"></i>
        <span>Analytics</span>
      </div>
      <router-link to="/profile" class="mobile-user" :class="{ 'has-avatar': authStore.user?.avatar }">
        <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" alt="Profile" />
        <i v-else class="bi bi-person-circle"></i>
      </router-link>
    </header>

    <!-- Sidebar -->
    <Sidebar v-if="isAuthenticated" :open="sidebarOpen" @close="closeSidebar" />

    <!-- Main Content -->
    <main class="main-content" :class="{ 'authenticated': isAuthenticated, 'with-bottom-nav': isAuthenticated }">
      <router-view v-slot="{ Component, route }">
        <transition :name="route.meta.transition || 'fade'" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav v-if="isAuthenticated && !sidebarOpen" class="mobile-bottom-nav">
      <router-link to="/" class="nav-item" :class="{ active: $route.path === '/dashboard' }">
        <i class="bi bi-house-door-fill"></i>
        <span>Home</span>
      </router-link>
      
      <router-link to="/work" class="nav-item" :class="{ active: $route.path === '/work' }">
        <i class="bi bi-briefcase-fill"></i>
        <span>Work</span>
      </router-link>
      
      <router-link to="/analytics" class="nav-item" :class="{ active: $route.path === '/analytics' }">
        <i class="bi bi-graph-up-arrow"></i>
        <span>Analytics</span>
      </router-link>
      
      <router-link to="/calendar" class="nav-item" :class="{ active: $route.path === '/profile' }">
        <i class="bi bi-calendar-fill"></i>
        <span>Calendar</span>
      </router-link>
    </nav>

    <!-- Overlay for mobile -->
    <div 
      v-if="sidebarOpen && isAuthenticated" 
      class="sidebar-overlay"
      @click="closeSidebar"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import Sidebar from './components/Sidebar.vue'
import PWAManager from './components/PWAManager.vue'
import PWAPrompts from './components/PWAPrompts.vue'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const sidebarOpen = ref(false)
const isAuthenticated = computed(() => authStore.isAuthenticated)

// PWA state
const pwaManager = ref(null)
const canInstall = ref(false)
const isOnline = ref(navigator.onLine)
const updateAvailable = ref(false)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

// PWA handlers
const onInstallAvailable = () => {
  canInstall.value = true
  console.log('[App] PWA install available')
}

const onUpdateAvailable = () => {
  updateAvailable.value = true
  console.log('[App] PWA update available')
}

const onAppInstalled = () => {
  toast.success('App installed successfully! 🎉')
  console.log('[App] PWA installed')
}

const onOnline = () => {
  isOnline.value = true
  toast.success('You\'re back online!')
}

const onOffline = () => {
  isOnline.value = false
  toast.warning('You\'re offline. Some features may be limited.')
}

const installApp = async () => {
  if (pwaManager.value) {
    const installed = await pwaManager.value.installApp()
    if (installed) {
      toast.success('Thank you for installing Job Analytics!')
    }
  }
}

const applyUpdate = () => {
  if (pwaManager.value) {
    pwaManager.value.applyUpdate()
  }
}

// Close sidebar on route change (mobile)
watch(() => route.path, () => {
  if (window.innerWidth < 1024) {
    closeSidebar()
  }
})

// Close sidebar on window resize to desktop
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      sidebarOpen.value = false
    }
  })
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  // Color palette
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --primary-light: #3b82f6;
  --secondary: #10b981;
  --secondary-dark: #059669;
  --accent: #f59e0b;
  --danger: #ef4444;
  --warning: #f59e0b;
  --success: #10b981;
  
  // Neutrals
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --border-color: #e2e8f0;
  
  // Text
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  --text-inverse: #ffffff;
  
  // Shadows
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  // Spacing
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  // Border radius
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
  
  // Transitions
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  
  // Typography
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

// Dark Theme
.dark-theme {
  --primary: #3b82f6;
  --primary-dark: #2563eb;
  --primary-light: #60a5fa;
  --secondary: #10b981;
  --secondary-dark: #059669;
  --accent: #f59e0b;
  --danger: #ef4444;
  --warning: #f59e0b;
  --success: #10b981;
  
  --bg-primary: #1e293b;
  --bg-secondary: #0f172a;
  --bg-tertiary: #334155;
  --border: #334155;
  --border-light: #475569;
  --border-color: #334155;
  
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
  --text-inverse: #0f172a;
  
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
}

// Compact Mode
.compact-mode {
  --spacing-xs: 0.125rem;
  --spacing-sm: 0.375rem;
  --spacing-md: 0.75rem;
  --spacing-lg: 1rem;
  --spacing-xl: 1.5rem;
  --spacing-2xl: 2rem;
  
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  background: var(--bg-secondary);
  color: var(--text-primary);
  line-height: 1.6;
  overflow-x: hidden;
}

#app {
  min-height: 100vh;
}

.app-container {
  display: flex;
  min-height: 100vh;
  position: relative;
}

// Mobile Header
.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border);
  padding: 0 var(--spacing-md);
  align-items: center;
  justify-content: space-between;
  z-index: 1000;
  box-shadow: var(--shadow-sm);
  
  @media (max-width: 1023px) {
    display: flex;
  }
  
  .menu-toggle {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--text-primary);
    cursor: pointer;
    padding: var(--spacing-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    transition: background var(--transition-fast);
    
    &:hover {
      background: var(--bg-secondary);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  .mobile-logo {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-weight: 700;
    font-size: 1.125rem;
    color: var(--primary);
    
    i {
      font-size: 1.5rem;
    }
  }
  
  .mobile-user {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: var(--text-secondary);
    overflow: hidden;
    background: var(--bg-secondary);
    text-decoration: none;
    cursor: pointer;
    transition: all var(--transition-fast);
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid var(--primary);
      opacity: 0;
      transform: scale(0.8);
      transition: all var(--transition-fast);
    }
    
    &:hover {
      transform: scale(1.05);
      
      &::after {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    &:active {
      transform: scale(0.95);
    }
    
    &.has-avatar {
      background: transparent;
      
      &:hover {
        box-shadow: 0 0 0 2px var(--primary);
      }
    }
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    i {
      font-size: 1.5rem;
    }
  }
}

// Main Content
.main-content {
  flex: 1;
  min-height: 100vh;
  transition: margin-left var(--transition-base);
  
  &.authenticated {
    margin-left: 280px;
    
    @media (max-width: 1023px) {
      margin-left: 0;
      padding-top: 60px;
    }
  }
  
  &.with-bottom-nav {
    @media (max-width: 1023px) {
      padding-bottom: 80px; // Space for bottom nav
    }
  }
  
  @media (max-width: 1023px) {
    width: 100%;
  }
}

// Mobile Bottom Navigation
.mobile-bottom-nav {
  display: none;
  
  @media (max-width: 1023px) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 70px;
    background: var(--bg-primary);
    border-top: 1px solid var(--border);
    padding: 0;
    z-index: 1000;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    animation: slideUpNav 0.3s ease-out;
    transition: transform var(--transition-base), opacity var(--transition-base);
    
    .nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      color: var(--text-secondary);
      text-decoration: none;
      transition: all var(--transition-fast);
      position: relative;
      
      i {
        font-size: 1.5rem;
        transition: all var(--transition-fast);
      }
      
      span {
        font-size: 0.75rem;
        font-weight: 500;
        transition: all var(--transition-fast);
      }
      
      &.active {
        color: var(--primary);
        background: linear-gradient(180deg, 
          rgba(99, 102, 241, 0.08) 0%, 
          rgba(99, 102, 241, 0.02) 100%);
        
        i {
          transform: translateY(-2px);
        }
        
        span {
          font-weight: 600;
        }
        
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 50%;
          height: 3px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            var(--primary) 50%, 
            transparent 100%);
          border-radius: 0 0 3px 3px;
        }
      }
      
      &:active {
        transform: scale(0.95);
      }
      
      // Ripple effect on tap
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--primary);
        opacity: 0;
        border-radius: 12px;
        transition: opacity var(--transition-fast);
      }
      
      &:active::after {
        opacity: 0.1;
      }
    }
  }
}

// Dark theme adjustments for bottom nav
.dark-theme {
  .mobile-bottom-nav {
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  }
}

// Hide bottom nav when sidebar is open
.sidebar-open {
  .mobile-bottom-nav {
    @media (max-width: 1023px) {
      transform: translateY(100%);
      opacity: 0;
      pointer-events: none;
    }
  }
}

// Sidebar Overlay
.sidebar-overlay {
  display: none;
  
  @media (max-width: 1023px) {
    display: block;
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 998;
    backdrop-filter: blur(4px);
  }
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-base);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all var(--transition-base);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all var(--transition-base);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

// Bottom Nav Animation
@keyframes slideUpNav {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

// Compact Mode - Reduce bottom nav height
.compact-mode {
  .mobile-bottom-nav {
    @media (max-width: 1023px) {
      height: 60px;
      
      .nav-item {
        i {
          font-size: 1.25rem;
        }
        
        span {
          font-size: 0.7rem;
        }
      }
    }
  }
  
  .main-content.with-bottom-nav {
    @media (max-width: 1023px) {
      padding-bottom: 70px;
    }
  }
}

// Utility Classes
.container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  
  @media (min-width: 768px) {
    padding: 0 var(--spacing-lg);
  }
  
  @media (min-width: 1024px) {
    padding: 0 var(--spacing-xl);
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.5;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:not(:disabled):active {
    transform: scale(0.98);
  }
}

.btn-primary {
  background: var(--primary);
  color: var(--text-inverse);
  
  &:not(:disabled):hover {
    background: var(--primary-dark);
    box-shadow: var(--shadow-md);
  }
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  
  &:not(:disabled):hover {
    background: var(--border);
  }
}

.btn-success {
  background: var(--success);
  color: var(--text-inverse);
  
  &:not(:disabled):hover {
    background: var(--secondary-dark);
  }
}

.btn-danger {
  background: var(--danger);
  color: var(--text-inverse);
  
  &:not(:disabled):hover {
    background: #dc2626;
  }
}

.card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
  transition: all var(--transition-fast);
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
}

// Scrollbar
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: var(--radius-full);
  
  &:hover {
    background: var(--text-tertiary);
  }
}

// Loading spinner
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Responsive helpers
.mobile-only {
  display: none !important;
  
  @media (max-width: 767px) {
    display: block !important;
  }
}

.desktop-only {
  @media (max-width: 767px) {
    display: none !important;
  }
}
</style>
