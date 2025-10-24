<template>
  <transition name="slide-up">
    <div v-if="showPrompt" class="install-prompt">
      <div class="prompt-content">
        <div class="prompt-icon">
          <i class="bi bi-download"></i>
        </div>
        <div class="prompt-text">
          <h4>Install Job Analytics</h4>
          <p>Install our app for a better experience and offline access</p>
        </div>
        <div class="prompt-actions">
          <button @click="install" class="btn-install">
            Install
          </button>
          <button @click="dismiss" class="btn-dismiss">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
    </div>
  </transition>

  <div v-if="!isOnline" class="offline-indicator">
    <i class="bi bi-wifi-off"></i>
    <span>You're offline</span>
  </div>

  <transition name="fade">
    <div v-if="updateAvailable" class="update-prompt">
      <div class="update-content">
        <i class="bi bi-arrow-clockwise"></i>
        <span>New version available</span>
        <button @click="applyUpdate" class="btn-update">
          Update Now
        </button>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'PWAPrompts',

  props: {
    canInstall: {
      type: Boolean,
      default: false
    },
    isOnline: {
      type: Boolean,
      default: true
    },
    updateAvailable: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      showPrompt: false,
      dismissed: false
    }
  },

  watch: {
    canInstall(newVal) {
      if (newVal && !this.dismissed) {
        // Show install prompt after 10 seconds
        setTimeout(() => {
          this.showPrompt = true
        }, 10000)
      }
    }
  },

  methods: {
    install() {
      this.$emit('install')
      this.showPrompt = false
    },

    dismiss() {
      this.showPrompt = false
      this.dismissed = true
      // Remember dismissal for 7 days
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    },

    applyUpdate() {
      this.$emit('update')
    }
  },

  mounted() {
    // Check if user dismissed install prompt recently
    const dismissedTime = localStorage.getItem('pwa-install-dismissed')
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        this.dismissed = true
      } else {
        localStorage.removeItem('pwa-install-dismissed')
      }
    }
  }
}
</script>

<style scoped lang="scss">
.install-prompt {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  max-width: 500px;
  width: calc(100% - 40px);
  
  .prompt-content {
    background: white;
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .prompt-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    flex-shrink: 0;
  }

  .prompt-text {
    flex: 1;

    h4 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    p {
      margin: 0;
      font-size: 14px;
      color: #64748b;
    }
  }

  .prompt-actions {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
  }

  .btn-install {
    background: #6366f1;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #4f46e5;
      transform: translateY(-1px);
    }
  }

  .btn-dismiss {
    background: #f1f5f9;
    color: #64748b;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #e2e8f0;
      color: #475569;
    }
  }
}

.offline-indicator {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #ef4444;
  color: white;
  padding: 12px 24px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  z-index: 9999;

  i {
    font-size: 16px;
  }
}

.update-prompt {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;

  .update-content {
    background: white;
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;

    i {
      font-size: 24px;
      color: #6366f1;
    }

    span {
      font-weight: 600;
      color: #1e293b;
    }

    .btn-update {
      background: #6366f1;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #4f46e5;
      }
    }
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  transform: translateX(-50%) translateY(100px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateX(-50%) translateY(100px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Dark mode support
html.dark-theme {
  .install-prompt .prompt-content,
  .update-prompt .update-content {
    background: #1e293b;
    
    h4, span {
      color: #f1f5f9;
    }

    p {
      color: #94a3b8;
    }
  }

  .btn-dismiss {
    background: #334155;
    color: #94a3b8;

    &:hover {
      background: #475569;
      color: #cbd5e1;
    }
  }
}

@media (max-width: 768px) {
  .install-prompt {
    bottom: 10px;
    width: calc(100% - 20px);
    
    .prompt-content {
      padding: 12px 16px;
    }

    .prompt-icon {
      width: 40px;
      height: 40px;
      font-size: 20px;
    }

    .prompt-text h4 {
      font-size: 14px;
    }

    .prompt-text p {
      font-size: 12px;
    }

    .btn-install {
      padding: 8px 16px;
      font-size: 13px;
    }
  }

  .update-prompt {
    top: 10px;
    right: 10px;
    left: 10px;

    .update-content {
      justify-content: space-between;
    }
  }
}
</style>
