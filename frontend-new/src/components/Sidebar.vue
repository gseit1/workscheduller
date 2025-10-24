<template>
  <aside class="sidebar" :class="{ 'open': open }">
    <div class="sidebar-header">
      <div class="logo">
        <i class="bi bi-graph-up-arrow"></i>
        <span class="logo-text">Analytics Pro</span>
      </div>
      <button class="close-btn" @click="$emit('close')" aria-label="Close menu">
        <i class="bi bi-x"></i>
      </button>
    </div>

    <div class="sidebar-user">
      <div class="user-avatar" :class="{ 'has-image': user?.avatar }">
        <img v-if="user?.avatar" :src="user.avatar" alt="Profile" />
        <i v-else class="bi bi-person-circle"></i>
      </div>
      <div class="user-info">
        <div class="user-name">{{ user?.name || user?.username || 'User' }}</div>
        <div class="user-email">{{ user?.email || '' }}</div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ 'active': isActive(item.to) }"
      >
        <i class="nav-icon bi" :class="item.icon"></i>
        <span class="nav-label">{{ item.label }}</span>
        <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <router-link to="/settings" class="footer-link">
        <i class="bi bi-gear"></i>
        <span>Settings</span>
      </router-link>
      <router-link to="/logout" class="footer-link logout">
        <i class="bi bi-box-arrow-right"></i>
        <span>Logout</span>
      </router-link>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const route = useRoute()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'bi-speedometer2' },
  { to: '/calendar', label: 'Calendar', icon: 'bi-calendar3' },
  { to: '/work', label: 'Work Logs', icon: 'bi-briefcase' },
  { to: '/expenses', label: 'Expenses', icon: 'bi-wallet2' },
  { to: '/goals', label: 'Goals', icon: 'bi-bullseye' },
  { to: '/analytics', label: 'Analytics', icon: 'bi-bar-chart-line' },
  { to: '/profile', label: 'Profile', icon: 'bi-person' }
]

const isActive = (path) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

<style lang="scss" scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background: var(--bg-primary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  z-index: 999;
  transition: transform var(--transition-base);
  box-shadow: var(--shadow-lg);
  
  @media (max-width: 1023px) {
    transform: translateX(-100%);
    
    &.open {
      transform: translateX(0);
    }
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
  
  .logo {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--primary);
    
    i {
      font-size: 1.75rem;
    }
  }
  
  .close-btn {
    display: none;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--text-secondary);
    cursor: pointer;
    padding: var(--spacing-sm);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
    
    &:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
    
    @media (max-width: 1023px) {
      display: block;
    }
  }
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  
  .user-avatar {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-full);
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-inverse);
    font-size: 1.75rem;
    box-shadow: var(--shadow-md);
    overflow: hidden;
    flex-shrink: 0;
    
    &.has-image {
      background: var(--bg-secondary);
    }
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    i {
      font-size: 1.75rem;
    }
  }
  
  .user-info {
    flex: 1;
    min-width: 0;
    
    .user-name {
      font-weight: 600;
      font-size: 0.9375rem;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .user-email {
      font-size: 0.8125rem;
      color: var(--text-tertiary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md);
  overflow-y: auto;
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: 0.75rem var(--spacing-md);
    margin-bottom: var(--spacing-xs);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9375rem;
    transition: all var(--transition-fast);
    position: relative;
    
    &:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
      transform: translateX(4px);
    }
    
    &.active {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      color: var(--text-inverse);
      box-shadow: var(--shadow-md);
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 60%;
        background: var(--text-inverse);
        border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      }
    }
    
    .nav-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    
    .nav-label {
      flex: 1;
    }
    
    .nav-badge {
      background: var(--danger);
      color: var(--text-inverse);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-full);
      min-width: 20px;
      text-align: center;
    }
  }
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  
  .footer-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: 0.625rem var(--spacing-md);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.875rem;
    transition: all var(--transition-fast);
    
    i {
      font-size: 1.125rem;
    }
    
    &:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
    
    &.logout {
      color: var(--danger);
      
      &:hover {
        background: rgba(239, 68, 68, 0.1);
        color: var(--danger);
      }
    }
  }
}

// Scrollbar
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: var(--radius-full);
  
  &:hover {
    background: var(--text-tertiary);
  }
}
</style>
