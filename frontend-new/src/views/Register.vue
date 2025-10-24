<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">
            <i class="bi bi-graph-up-arrow"></i>
          </div>
          <h1>Create Account</h1>
          <p>Join Analytics Pro and start tracking</p>
        </div>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label for="name">
              <i class="bi bi-person"></i>
              Full Name
            </label>
            <input
              id="name"
              type="text"
              v-model="name"
              class="form-input"
              placeholder="John Doe"
              required
              autofocus
            />
          </div>

          <div class="form-group">
            <label for="email">
              <i class="bi bi-envelope"></i>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              v-model="email"
              class="form-input"
              placeholder="your@email.com"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">
              <i class="bi bi-lock"></i>
              Password
            </label>
            <div class="password-input">
              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                class="form-input"
                placeholder="Create a strong password"
                required
                minlength="6"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                <i class="bi" :class="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="hourlyRate">
              <i class="bi bi-cash"></i>
              Hourly Rate (€)
            </label>
            <input
              id="hourlyRate"
              type="number"
              step="0.01"
              v-model="hourlyRate"
              class="form-input"
              placeholder="15.00"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            <span v-if="loading" class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></span>
            {{ loading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <div class="auth-divider">
          <span>or</span>
        </div>

        <div class="auth-footer">
          <p>Already have an account? <router-link to="/login">Sign in</router-link></p>
        </div>
      </div>

      <div class="auth-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const hourlyRate = ref(15)
const showPassword = ref(false)
const loading = ref(false)

const handleRegister = async () => {
  try {
    loading.value = true
    const result = await authStore.register({
      name: name.value,
      email: email.value,
      password: password.value,
      hourlyRate: hourlyRate.value
    })
    
    if (result.success) {
      toast.success('Account created successfully!')
      router.push('/')
    } else {
      toast.error(result.message || 'Registration failed')
    }
  } catch (error) {
    toast.error('An error occurred during registration')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: var(--spacing-lg);
  position: relative;
  overflow: hidden;
}

.auth-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
}

.auth-card {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 2;
  
  @media (max-width: 767px) {
    padding: var(--spacing-lg);
  }
}

.auth-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  
  .auth-logo {
    width: 72px;
    height: 72px;
    border-radius: var(--radius-xl);
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-lg);
    font-size: 2rem;
    color: white;
    box-shadow: var(--shadow-lg);
  }
  
  h1 {
    font-size: 1.875rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }
  
  p {
    color: var(--text-secondary);
    font-size: 1rem;
  }
}

.auth-form {
  .form-group {
    margin-bottom: var(--spacing-lg);
    
    label {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
      font-size: 0.875rem;
      
      i {
        color: var(--primary);
      }
    }
    
    .form-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid var(--border);
      border-radius: var(--radius-md);
      font-size: 1rem;
      transition: all var(--transition-fast);
      background: var(--bg-primary);
      color: var(--text-primary);
      
      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
      }
      
      &::placeholder {
        color: var(--text-tertiary);
      }
    }
  }
  
  .password-input {
    position: relative;
    
    .password-toggle {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-tertiary);
      cursor: pointer;
      font-size: 1.125rem;
      padding: var(--spacing-sm);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
      
      &:hover {
        color: var(--text-primary);
        background: var(--bg-secondary);
      }
    }
  }
  
  .form-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-lg);
    
    .checkbox {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: 0.875rem;
      color: var(--text-secondary);
      cursor: pointer;
      
      input {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
    }
    
    .forgot-link {
      font-size: 0.875rem;
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
  
  .btn-block {
    width: 100%;
    padding: 1rem;
    font-size: 1rem;
  }
}

.auth-divider {
  margin: var(--spacing-2xl) 0;
  text-align: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--border);
  }
  
  span {
    position: relative;
    background: var(--bg-primary);
    padding: 0 var(--spacing-md);
    color: var(--text-tertiary);
    font-size: 0.875rem;
  }
}

.auth-footer {
  text-align: center;
  
  p {
    color: var(--text-secondary);
    font-size: 0.9375rem;
    
    a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.auth-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
  
  .decoration-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(40px);
    
    &.circle-1 {
      width: 300px;
      height: 300px;
      top: -150px;
      right: -150px;
    }
    
    &.circle-2 {
      width: 200px;
      height: 200px;
      bottom: -100px;
      left: -100px;
    }
    
    &.circle-3 {
      width: 150px;
      height: 150px;
      top: 50%;
      left: -75px;
      transform: translateY(-50%);
    }
  }
}
</style>
