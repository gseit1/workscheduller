<template>
  <div class="work-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Work Entries</h1>
        <p>Log and track your daily work hours</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="showAddModal = true">
          <i class="bi bi-plus-circle"></i>
          <span>Add Work</span>
        </button>
      </div>
    </div>

    <div class="work-content">
      <!-- Monthly Statistics -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-currency-euro"></i>
          </div>
          <div class="stat-details">
            <span class="stat-label">Total Earnings</span>
            <span class="stat-value">€{{ monthlyStats.totalEarnings }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-wallet2"></i>
          </div>
          <div class="stat-details">
            <span class="stat-label">Total Tips</span>
            <span class="stat-value">€{{ monthlyStats.totalTips }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-clock-history"></i>
          </div>
          <div class="stat-details">
            <span class="stat-label">Hours Worked</span>
            <span class="stat-value">{{ monthlyStats.totalHours }}h</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-calendar-check"></i>
          </div>
          <div class="stat-details">
            <span class="stat-label">Days Worked</span>
            <span class="stat-value">{{ monthlyStats.daysWorked }}/{{ monthlyStats.scheduledDays }}</span>
          </div>
        </div>
      </div>

      <div class="filters-bar">
        <div class="filter-group">
          <label>Month & Year</label>
          <div class="date-navigation">
            <button @click="previousMonth" class="btn btn-icon">
              <i class="bi bi-chevron-left"></i>
            </button>
            <span class="current-month">{{ currentMonthLabel }}</span>
            <button @click="nextMonth" class="btn btn-icon">
              <i class="bi bi-chevron-right"></i>
            </button>
            <button @click="goToCurrentMonth" class="btn btn-secondary btn-sm">
              Today
            </button>
          </div>
        </div>
      </div>

      <div class="work-list">
        <div v-if="workEntries.length === 0" class="empty-state">
          <i class="bi bi-clipboard-x"></i>
          <h3>No work entries yet</h3>
          <p>Start by adding your first work entry</p>
          <button class="btn btn-primary" @click="showAddModal = true">
            <i class="bi bi-plus-circle"></i>
            Add Work Entry
          </button>
        </div>

        <div v-else class="entries-grid">
          <div v-for="entry in workEntries" :key="entry.id" class="work-entry-card">
            <div class="entry-header">
              <div class="entry-date">
                <i class="bi bi-calendar3"></i>
                <span>{{ entry.date }}</span>
              </div>
              <div class="entry-actions">
                <button @click="editEntry(entry)" class="btn btn-sm btn-icon">
                  <i class="bi bi-pencil"></i>
                </button>
                <button @click="deleteEntry(entry)" class="btn btn-sm btn-icon btn-danger">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
            
            <div class="entry-body">
              <div class="entry-stat">
                <i class="bi bi-clock"></i>
                <div class="stat-content">
                  <span class="stat-label">Hours</span>
                  <span class="stat-value">{{ entry.hours }}</span>
                </div>
              </div>
              
              <div class="entry-stat">
                <i class="bi bi-cash-coin"></i>
                <div class="stat-content">
                  <span class="stat-label">Earnings</span>
                  <span class="stat-value">€{{ entry.earnings }}</span>
                </div>
              </div>

              <div class="entry-stat" v-if="entry.tips > 0">
                <i class="bi bi-wallet2"></i>
                <div class="stat-content">
                  <span class="stat-label">Tips</span>
                  <span class="stat-value">€{{ entry.tips }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="entry.description" class="entry-description">
              <p>{{ entry.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Work Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingEntry ? 'Edit Work Entry' : 'Add Work Entry' }}</h2>
          <button class="btn-close" @click="closeModal">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-body">
          <div class="form-group">
            <label for="workDate">
              <i class="bi bi-calendar3"></i>
              Work Date
            </label>
            <input
              id="workDate"
              type="date"
              v-model="formData.workDate"
              class="form-input"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="hoursWorked">
                <i class="bi bi-clock"></i>
                Hours Worked
              </label>
              <input
                id="hoursWorked"
                type="number"
                step="0.5"
                min="0"
                v-model="formData.hoursWorked"
                class="form-input"
                placeholder="8.0"
                required
              />
            </div>

            <div class="form-group">
              <label for="hourlyRate">
                <i class="bi bi-cash-coin"></i>
                Hourly Rate (€)
              </label>
              <input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                v-model="formData.hourlyRate"
                class="form-input"
                placeholder="15.00"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="tipsAmount">
              <i class="bi bi-wallet2"></i>
              Tips Amount (€)
            </label>
            <input
              id="tipsAmount"
              type="number"
              step="0.01"
              min="0"
              v-model="formData.tipsAmount"
              class="form-input"
              placeholder="0.00"
            />
          </div>

          <div class="form-group">
            <label for="notes">
              <i class="bi bi-journal-text"></i>
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              v-model="formData.notes"
              class="form-input"
              rows="3"
              placeholder="Add any notes about this work day..."
            ></textarea>
          </div>

          <div class="earnings-preview">
            <div class="preview-item">
              <span>Base Earnings:</span>
              <strong>€{{ calculateBaseEarnings }}</strong>
            </div>
            <div class="preview-item">
              <span>Tips:</span>
              <strong>€{{ formData.tipsAmount || 0 }}</strong>
            </div>
            <div class="preview-item total">
              <span>Total Earnings:</span>
              <strong>€{{ calculateTotalEarnings }}</strong>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner"></span>
              {{ submitting ? 'Saving...' : (editingEntry ? 'Update Entry' : 'Add Entry') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { format, addMonths, subMonths } from 'date-fns'
import api from '../services/api'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '../stores/auth'

const toast = useToast()
const authStore = useAuthStore()
const showAddModal = ref(false)
const editingEntry = ref(null)
const currentDate = ref(new Date())
const workEntries = ref([])
const loading = ref(false)
const submitting = ref(false)

// Monthly statistics
const monthlyStats = ref({
  totalEarnings: 0,
  totalTips: 0,
  totalHours: 0,
  daysWorked: 0,
  scheduledDays: 0
})

const formData = ref({
  workDate: format(new Date(), 'yyyy-MM-dd'),
  hoursWorked: 8,
  hourlyRate: authStore.user?.hourlyRate || 15,
  tipsAmount: 0,
  notes: ''
})

const currentMonthLabel = computed(() => {
  return format(currentDate.value, 'MMMM yyyy')
})

const previousMonth = () => {
  currentDate.value = subMonths(currentDate.value, 1)
  fetchWorkEntries()
  fetchMonthlyStats()
}

const nextMonth = () => {
  currentDate.value = addMonths(currentDate.value, 1)
  fetchWorkEntries()
  fetchMonthlyStats()
}

const goToCurrentMonth = () => {
  currentDate.value = new Date()
  fetchWorkEntries()
  fetchMonthlyStats()
}

const calculateBaseEarnings = computed(() => {
  const hours = parseFloat(formData.value.hoursWorked) || 0
  const rate = parseFloat(formData.value.hourlyRate) || 0
  return (hours * rate).toFixed(2)
})

const calculateTotalEarnings = computed(() => {
  const base = parseFloat(calculateBaseEarnings.value)
  const tips = parseFloat(formData.value.tipsAmount) || 0
  return (base + tips).toFixed(2)
})

const resetForm = () => {
  formData.value = {
    workDate: format(new Date(), 'yyyy-MM-dd'),
    hoursWorked: 8,
    hourlyRate: authStore.user?.hourlyRate || 15,
    tipsAmount: 0,
    notes: ''
  }
  editingEntry.value = null
}

const closeModal = () => {
  showAddModal.value = false
  resetForm()
}

const handleSubmit = async () => {
  try {
    submitting.value = true

    const payload = {
      workDate: formData.value.workDate,
      hoursWorked: parseFloat(formData.value.hoursWorked),
      hourlyRate: parseFloat(formData.value.hourlyRate),
      tipsAmount: parseFloat(formData.value.tipsAmount) || 0,
      notes: formData.value.notes || ''
    }

    if (editingEntry.value) {
      await api.put(`/work/days/${editingEntry.value.id}`, payload)
      toast.success('Work entry updated successfully')
    } else {
      await api.post('/work/days', payload)
      toast.success('Work entry added successfully')
    }

    closeModal()
    fetchWorkEntries()
    fetchMonthlyStats()
  } catch (error) {
    console.error('Error saving work entry:', error)
    toast.error(error.response?.data?.error || 'Failed to save work entry')
  } finally {
    submitting.value = false
  }
}

const fetchMonthlyStats = async () => {
  try {
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()
    
    // Fetch work days for the month
    const workResponse = await api.get('/work/days', {
      params: { month, year }
    })
    const workData = workResponse.data.workDays || []
    
    // Calculate stats from work days
    let totalEarnings = 0
    let totalTips = 0
    let totalHours = 0
    
    workData.forEach(day => {
      const baseEarnings = day.hoursWorked * day.hourlyRate
      const tips = day.tipsAmount || 0
      totalEarnings += baseEarnings + tips
      totalTips += tips
      totalHours += day.hoursWorked
    })
    
    // Fetch scheduled days count
    const calendarResponse = await api.get('/calendar/events', {
      params: { month, year }
    })
    const scheduledDays = calendarResponse.data.events?.length || 0
    
    monthlyStats.value = {
      totalEarnings: totalEarnings.toFixed(2),
      totalTips: totalTips.toFixed(2),
      totalHours: totalHours.toFixed(1),
      daysWorked: workData.length,
      scheduledDays: scheduledDays
    }
  } catch (error) {
    console.error('Error fetching monthly stats:', error)
  }
}

const fetchWorkEntries = async () => {
  try {
    loading.value = true
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()
    
    const response = await api.get('/work/days', {
      params: { month, year }
    })
    const workData = response.data.workDays || []
    workEntries.value = workData.map(entry => ({
      id: entry._id,
      date: format(new Date(entry.workDate), 'MMM d, yyyy'),
      hours: entry.hoursWorked,
      earnings: ((entry.hoursWorked * entry.hourlyRate) + (entry.tipsAmount || 0)).toFixed(2),
      tips: (entry.tipsAmount || 0).toFixed(2),
      description: entry.notes || 'No description',
      rawData: entry
    }))
  } catch (error) {
    console.error('Error fetching work entries:', error)
    toast.error('Failed to load work entries')
  } finally {
    loading.value = false
  }
}

const editEntry = (entry) => {
  editingEntry.value = entry
  formData.value = {
    workDate: format(new Date(entry.rawData.workDate), 'yyyy-MM-dd'),
    hoursWorked: entry.rawData.hoursWorked,
    hourlyRate: entry.rawData.hourlyRate,
    tipsAmount: entry.rawData.tipsAmount || 0,
    notes: entry.rawData.notes || ''
  }
  showAddModal.value = true
}

const deleteEntry = async (entry) => {
  if (!confirm('Are you sure you want to delete this work entry?')) return
  
  try {
    await api.delete(`/work/days/${entry.id}`)
    toast.success('Work entry deleted successfully')
    fetchWorkEntries()
    fetchMonthlyStats()
  } catch (error) {
    console.error('Error deleting work entry:', error)
    toast.error('Failed to delete work entry')
  }
}

onMounted(() => {
  fetchWorkEntries()
  fetchMonthlyStats()
})
</script>

<style lang="scss" scoped>
.work-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-md);
  
  .header-content {
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
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: var(--radius-md);
    background: var(--primary-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: var(--primary);
  }

  .stat-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }
  }
}

.filters-bar {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  
  .filter-group {
    label {
      display: block;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: var(--spacing-sm);
      font-size: 0.875rem;
    }
    
    .date-navigation {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      
      .current-month {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text-primary);
        min-width: 200px;
        text-align: center;
      }
      
      .btn-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  
  i {
    font-size: 4rem;
    color: var(--text-secondary);
    opacity: 0.3;
    margin-bottom: var(--spacing-lg);
  }
  
  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }
  
  p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xl);
  }
}

.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.work-entry-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s;
  
  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
  
  .entry-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
    
    .entry-date {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .entry-actions {
      display: flex;
      gap: var(--spacing-sm);
    }
  }
  
  .entry-body {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-md);
    
    .entry-stat {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex: 0 0 auto;
      
      i {
        font-size: 1.5rem;
        color: var(--primary);
      }
      
      .stat-content {
        display: flex;
        flex-direction: column;
        
        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }
      }
    }
  }
  
  .entry-description {
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--border-color);
    
    p {
      color: var(--text-secondary);
      font-size: 0.875rem;
      line-height: 1.5;
      margin: 0;
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    .header-content h1 {
      font-size: 1.5rem;
    }
  }
  
  .entries-grid {
    grid-template-columns: 1fr;
  }
  
  .filters-bar .filter-group .form-select {
    width: 100%;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
  
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
  
  .btn-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: var(--text-secondary);
    cursor: pointer;
    padding: var(--spacing-sm);
    border-radius: var(--radius-md);
    transition: all 0.2s;
    
    &:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
  }
}

.modal-body {
  padding: var(--spacing-xl);
  
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
      padding: var(--spacing-md);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 1rem;
      transition: all 0.2s;
      
      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }
    }
    
    textarea.form-input {
      resize: vertical;
      font-family: inherit;
    }
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
    
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
}

.earnings-preview {
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  
  .preview-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;
    color: white;
    
    span {
      opacity: 0.9;
    }
    
    strong {
      font-size: 1.125rem;
      font-weight: 700;
    }
    
    &.total {
      border-top: 2px solid rgba(255, 255, 255, 0.3);
      margin-top: var(--spacing-sm);
      padding-top: var(--spacing-md);
      
      strong {
        font-size: 1.5rem;
      }
    }
  }
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  
  .btn {
    min-width: 120px;
    
    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
