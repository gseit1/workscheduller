import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const isInitialized = ref(false)
  
  const isAuthenticated = computed(() => !!token.value)
  
  const initialize = async () => {
    if (isInitialized.value) return
    
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken) {
      token.value = storedToken
      
      if (storedUser) {
        try {
          user.value = JSON.parse(storedUser)
        } catch (e) {
          console.error('Failed to parse stored user', e)
        }
      }
      
      // Try to fetch fresh user data
      try {
        const response = await api.get('/auth/me')
        user.value = response.data.user
        localStorage.setItem('user', JSON.stringify(response.data.user))
      } catch (error) {
        console.error('Failed to fetch user data', error)
        // If token is invalid, logout
        if (error.response?.status === 401) {
          logout()
        }
      }
    }
    
    isInitialized.value = true
  }
  
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      token.value = response.data.token
      user.value = response.data.user
      
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      }
    }
  }
  
  const register = async (userData) => {
    try {
      // Map 'name' to 'username' for backend compatibility
      const payload = {
        username: userData.name || userData.username,
        email: userData.email,
        password: userData.password,
        hourlyRate: userData.hourlyRate,
        currency: userData.currency || 'EUR'
      }
      
      const response = await api.post('/auth/register', payload)
      token.value = response.data.token
      user.value = response.data.user
      
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      }
    }
  }
  
  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
  
  const updateUser = (userData) => {
    user.value = { ...user.value, ...userData }
    localStorage.setItem('user', JSON.stringify(user.value))
  }
  
  const updateHourlyRate = async (hourlyRate, effectiveFrom) => {
    try {
      await api.put('/auth/hourly-rate', { hourlyRate, effectiveFrom })
      updateUser({ hourlyRate })
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Update failed'
      }
    }
  }

  const updateAvatar = async (avatar) => {
    try {
      const response = await api.put('/auth/avatar', { avatar })
      if (response.data.user) {
        user.value = response.data.user
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to update avatar'
      }
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData)
      if (response.data.user) {
        user.value = response.data.user
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to update profile'
      }
    }
  }
  
  return {
    user,
    token,
    isAuthenticated,
    initialize,
    login,
    register,
    logout,
    updateUser,
    updateHourlyRate,
    updateAvatar,
    updateProfile
  }
})
