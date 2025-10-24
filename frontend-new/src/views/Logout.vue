<template>
  <div class="logout-page">
    <div class="logout-container">
      <div class="logout-card">
        <div class="logout-icon">
          <i class="bi bi-box-arrow-right"></i>
        </div>
        <h2>Logging Out...</h2>
        <p>See you soon!</p>
        <div class="spinner"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  authStore.logout()
  await new Promise(resolve => setTimeout(resolve, 1500))
  router.push('/login')
})
</script>

<style lang="scss" scoped>
.logout-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.logout-container {
  width: 100%;
  max-width: 400px;
  padding: var(--spacing-lg);
}

.logout-card {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  
  .logout-icon {
    width: 80px;
    height: 80px;
    border-radius: var(--radius-xl);
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-lg);
    font-size: 2.5rem;
    color: white;
    box-shadow: var(--shadow-lg);
  }
  
  h2 {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }
  
  p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xl);
  }
  
  .spinner {
    margin: 0 auto;
  }
}
</style>
