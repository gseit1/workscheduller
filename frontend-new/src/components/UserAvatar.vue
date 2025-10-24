<template>
  <div class="user-avatar" :class="[size, { 'has-image': avatar }]">
    <img v-if="avatar" :src="avatar" :alt="name" />
    <div v-else class="avatar-initials">
      {{ initials }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  avatar: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: 'User'
  },
  size: {
    type: String,
    default: 'md', // xs, sm, md, lg, xl
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  }
})

const initials = computed(() => {
  if (!props.name) return 'U'
  
  const parts = props.name.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
})
</script>

<style lang="scss" scoped>
.user-avatar {
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: white;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
  
  &.has-image {
    background: var(--bg-secondary);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .avatar-initials {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  
  // Sizes
  &.xs {
    width: 24px;
    height: 24px;
    font-size: 0.625rem;
  }
  
  &.sm {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }
  
  &.md {
    width: 48px;
    height: 48px;
    font-size: 1rem;
  }
  
  &.lg {
    width: 64px;
    height: 64px;
    font-size: 1.25rem;
  }
  
  &.xl {
    width: 120px;
    height: 120px;
    font-size: 2rem;
  }
}
</style>
