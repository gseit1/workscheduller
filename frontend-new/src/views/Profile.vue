<template>
  <div class="profile-page">
    <div class="page-header">
      <h1>Profile Settings</h1>
      <p>Manage your account information and preferences</p>
    </div>

    <div class="profile-content">
      <div class="profile-card">
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <div class="avatar" :class="{ 'has-image': profile.avatar }">
              <img v-if="profile.avatar" :src="profile.avatar" alt="Profile" />
              <i v-else class="bi bi-person-circle"></i>
            </div>
            <input 
              ref="fileInput" 
              type="file" 
              accept="image/*" 
              @change="handleImageUpload" 
              style="display: none"
            />
            <button 
              type="button" 
              class="btn btn-sm btn-primary avatar-btn"
              @click="$refs.fileInput.click()"
            >
              <i class="bi bi-camera"></i>
            </button>
          </div>
          <button 
            v-if="profile.avatar" 
            type="button"
            class="btn btn-sm btn-outline-danger remove-avatar-btn"
            @click="removeAvatar"
          >
            <i class="bi bi-trash"></i>
            Remove Photo
          </button>
        </div>

        <form @submit.prevent="updateProfile" class="profile-form">
          <div class="form-section">
            <h3>Personal Information</h3>
            
            <div class="form-group">
              <label>Full Name</label>
              <input 
                v-model="profile.name" 
                type="text" 
                class="form-control"
                placeholder="Enter your name"
              />
            </div>
            
            <div class="form-group">
              <label>Email Address</label>
              <input 
                v-model="profile.email" 
                type="email" 
                class="form-control"
                placeholder="Enter your email"
              />
            </div>
            
            <div class="form-group">
              <label>Hourly Rate ($)</label>
              <input 
                v-model="profile.hourlyRate" 
                type="number" 
                class="form-control"
                step="0.01"
                placeholder="30.00"
              />
            </div>
          </div>

          <div class="form-section">
            <h3>Preferences</h3>
            
            <div class="form-group">
              <label>Currency</label>
              <select v-model="profile.currency" class="form-select">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Timezone</label>
              <select v-model="profile.timezone" class="form-select">
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
              </select>
            </div>
            
            <div class="form-group">
              <div class="checkbox-group">
                <input 
                  v-model="profile.emailNotifications" 
                  type="checkbox" 
                  id="emailNotifications"
                />
                <label for="emailNotifications">
                  Email notifications for goal achievements
                </label>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-lg">
              <i class="bi bi-check-circle"></i>
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <div class="security-card">
        <h3>Security</h3>
        <p>Update your password to keep your account secure</p>
        
        <form @submit.prevent="updatePassword" class="password-form">
          <div class="form-group">
            <label>Current Password</label>
            <input 
              v-model="passwordForm.current" 
              type="password" 
              class="form-control"
              placeholder="Enter current password"
            />
          </div>
          
          <div class="form-group">
            <label>New Password</label>
            <input 
              v-model="passwordForm.new" 
              type="password" 
              class="form-control"
              placeholder="Enter new password"
            />
          </div>
          
          <div class="form-group">
            <label>Confirm New Password</label>
            <input 
              v-model="passwordForm.confirm" 
              type="password" 
              class="form-control"
              placeholder="Confirm new password"
            />
          </div>
          
          <button type="submit" class="btn btn-secondary">
            <i class="bi bi-shield-check"></i>
            Update Password
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const toast = useToast()

const fileInput = ref(null)

const profile = ref({
  name: '',
  email: '',
  hourlyRate: 30,
  currency: 'USD',
  timezone: 'America/New_York',
  emailNotifications: true,
  avatar: ''
})

const passwordForm = ref({
  current: '',
  new: '',
  confirm: ''
})

const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Image size must be less than 5MB')
    return
  }
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    toast.error('Please select a valid image file')
    return
  }
  
  // Create preview and upload
  const reader = new FileReader()
  reader.onload = async (e) => {
    const avatarData = e.target.result
    profile.value.avatar = avatarData
    
    try {
      // Save to API
      const response = await authStore.updateAvatar(avatarData)
      if (response.success) {
        toast.success('Profile photo updated!')
      } else {
        toast.error(response.message || 'Failed to update photo')
        profile.value.avatar = authStore.user?.avatar || ''
      }
    } catch (error) {
      toast.error('Failed to update photo')
      profile.value.avatar = authStore.user?.avatar || ''
    }
  }
  reader.readAsDataURL(file)
}

const removeAvatar = async () => {
  try {
    const response = await authStore.updateAvatar('')
    if (response.success) {
      profile.value.avatar = ''
      toast.success('Profile photo removed!')
    } else {
      toast.error(response.message || 'Failed to remove photo')
    }
  } catch (error) {
    toast.error('Failed to remove photo')
  }
}

const updateProfile = async () => {
  try {
    const response = await authStore.updateProfile({
      username: profile.value.name,
      hourlyRate: profile.value.hourlyRate,
      currency: profile.value.currency
    })
    
    if (response.success) {
      toast.success('Profile updated successfully!')
    } else {
      toast.error(response.message || 'Failed to update profile')
    }
  } catch (error) {
    toast.error('Failed to update profile')
  }
}

const updatePassword = () => {
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    toast.error('Passwords do not match!')
    return
  }
  
  toast.success('Password updated successfully!')
  passwordForm.value = { current: '', new: '', confirm: '' }
  // TODO: Call API to update password
}

onMounted(() => {
  if (authStore.user) {
    profile.value.name = authStore.user.name || authStore.user.username
    profile.value.email = authStore.user.email
    profile.value.hourlyRate = authStore.user.hourlyRate || 30
    profile.value.avatar = authStore.user.avatar || ''
  }
})
</script>

<style lang="scss" scoped>
.profile-page {
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

.profile-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.profile-card,
.security-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.avatar-section {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  
  .avatar-wrapper {
    position: relative;
    display: inline-block;
    margin-bottom: var(--spacing-md);
    
    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 4rem;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      border: 4px solid var(--bg-primary);
      
      &.has-image {
        background: var(--bg-secondary);
      }
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      i {
        font-size: 4rem;
      }
    }
    
    .avatar-btn {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-md);
      
      &:hover {
        transform: scale(1.1);
      }
    }
  }
  
  .remove-avatar-btn {
    margin-top: var(--spacing-md);
  }
}

.profile-form,
.password-form {
  .form-section {
    margin-bottom: var(--spacing-2xl);
    
    h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-sm);
      border-bottom: 2px solid var(--border-color);
    }
  }
  
  .form-group {
    margin-bottom: var(--spacing-lg);
    
    label {
      display: block;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
    }
  }
  
  .checkbox-group {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    
    input[type="checkbox"] {
      width: 20px;
      height: 20px;
    }
    
    label {
      margin: 0;
      font-weight: 400;
      cursor: pointer;
    }
  }
  
  .form-actions {
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--border-color);
  }
}

.security-card {
  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }
  
  p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xl);
  }
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 1.5rem;
  }
  
  .profile-card,
  .security-card {
    padding: var(--spacing-lg);
  }
}
</style>
