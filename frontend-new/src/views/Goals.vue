<template>
  <div class="goals-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Goals</h1>
        <p>Set and track your financial goals</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="showAddModal = true">
          <i class="bi bi-plus-circle"></i>
          <span>New Goal</span>
        </button>
      </div>
    </div>

    <div class="goals-content">
      <div v-if="goals.length === 0" class="empty-state">
        <i class="bi bi-bullseye"></i>
        <h3>No goals set yet</h3>
        <p>Create your first financial goal to start tracking your progress</p>
        <button class="btn btn-primary" @click="showAddModal = true">
          <i class="bi bi-plus-circle"></i>
          Create Goal
        </button>
      </div>

      <div v-else class="goals-grid">
        <div v-for="goal in goals" :key="goal.id" class="goal-card">
          <div class="goal-header">
            <h3>{{ goal.title }}</h3>
            <div class="goal-actions">
              <button @click="editGoal(goal)" class="btn btn-sm btn-icon">
                <i class="bi bi-pencil"></i>
              </button>
              <button @click="deleteGoal(goal)" class="btn btn-sm btn-icon btn-danger">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          
          <div class="goal-amount">
            <div class="current-amount">
              €{{ goal.currentAmount }}
            </div>
            <div class="target-amount">
              of €{{ goal.targetAmount }}
            </div>
          </div>
          
          <div class="goal-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${goal.progress}%` }"
              ></div>
            </div>
            <div class="progress-label">{{ goal.progress }}%</div>
          </div>
          
          <div class="goal-footer">
            <div class="goal-deadline">
              <i class="bi bi-calendar-check"></i>
              <span>{{ goal.deadline }}</span>
            </div>
            <div :class="['goal-status', goal.statusClass]">
              {{ goal.status }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Goal Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingGoal ? 'Edit Goal' : 'Create New Goal' }}</h3>
          <button class="btn-close" @click="closeModal">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Goal Title</label>
            <input 
              v-model="goalForm.title" 
              type="text" 
              class="form-control"
              placeholder="e.g., Emergency Fund"
              required
            />
          </div>
          <div class="form-group">
            <label>Description (Optional)</label>
            <textarea 
              v-model="goalForm.description" 
              class="form-control"
              placeholder="Add details about your goal..."
              rows="3"
            ></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Current Amount (€)</label>
              <input 
                v-model.number="goalForm.currentAmount" 
                type="number" 
                step="0.01"
                class="form-control"
                placeholder="0.00"
                required
              />
            </div>
            <div class="form-group">
              <label>Target Amount (€)</label>
              <input 
                v-model.number="goalForm.targetAmount" 
                type="number" 
                step="0.01"
                class="form-control"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Deadline</label>
              <input 
                v-model="goalForm.deadline" 
                type="date" 
                class="form-control"
                required
              />
            </div>
            <div class="form-group">
              <label>Category</label>
              <select v-model="goalForm.category" class="form-control">
                <option value="general">General</option>
                <option value="savings">Savings</option>
                <option value="investment">Investment</option>
                <option value="equipment">Equipment</option>
                <option value="education">Education</option>
                <option value="emergency">Emergency Fund</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">
            Cancel
          </button>
          <button 
            @click="saveGoal" 
            class="btn btn-primary"
            :disabled="!goalForm.title || !goalForm.targetAmount || !goalForm.deadline"
          >
            {{ editingGoal ? 'Update Goal' : 'Create Goal' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { format, isPast, differenceInDays } from 'date-fns'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const toast = useToast()
const showAddModal = ref(false)
const editingGoal = ref(null)
const goals = ref([])
const loading = ref(false)

// Goal form
const goalForm = ref({
  id: null,
  title: '',
  description: '',
  targetAmount: 0,
  currentAmount: 0,
  deadline: format(new Date(), 'yyyy-MM-dd'),
  category: 'general'
})

const fetchGoals = async () => {
  try {
    loading.value = true
    const response = await api.get('/goals')
    const goalsData = response.data.goals || []
    
    goals.value = goalsData.map(goal => {
      const progress = goal.targetAmount > 0 
        ? Math.round((goal.currentAmount / goal.targetAmount) * 100) 
        : 0
      
      const deadline = new Date(goal.deadline)
      const daysLeft = differenceInDays(deadline, new Date())
      const isPastDeadline = isPast(deadline) && goal.status !== 'completed'
      
      let status = 'In Progress'
      let statusClass = 'status-warning'
      
      if (goal.status === 'completed' || progress >= 100) {
        status = 'Completed'
        statusClass = 'status-success'
      } else if (isPastDeadline) {
        status = 'Overdue'
        statusClass = 'status-danger'
      } else if (progress >= 75) {
        status = 'Almost There'
        statusClass = 'status-success'
      } else if (daysLeft <= 30) {
        status = 'Urgent'
        statusClass = 'status-danger'
      }
      
      return {
        id: goal._id,
        title: goal.title,
        description: goal.description,
        currentAmount: goal.currentAmount.toFixed(2),
        targetAmount: goal.targetAmount.toFixed(2),
        progress: Math.min(progress, 100),
        deadline: format(deadline, 'MMM d, yyyy'),
        status,
        statusClass,
        category: goal.category,
        rawData: goal
      }
    })
  } catch (error) {
    console.error('Error fetching goals:', error)
    toast.error('Failed to load goals')
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  showAddModal.value = false
  editingGoal.value = null
  goalForm.value = {
    id: null,
    title: '',
    description: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: format(new Date(), 'yyyy-MM-dd'),
    category: 'general'
  }
}

const saveGoal = async () => {
  try {
    const payload = {
      title: goalForm.value.title,
      description: goalForm.value.description,
      targetAmount: parseFloat(goalForm.value.targetAmount),
      currentAmount: parseFloat(goalForm.value.currentAmount),
      deadline: goalForm.value.deadline,
      category: goalForm.value.category
    }

    if (editingGoal.value) {
      await api.put(`/goals/${goalForm.value.id}`, payload)
      toast.success('Goal updated successfully!')
    } else {
      await api.post('/goals', payload)
      toast.success('Goal created successfully!')
    }
    
    closeModal()
    fetchGoals()
  } catch (error) {
    console.error('Error saving goal:', error)
    toast.error(error.response?.data?.error || 'Failed to save goal')
  }
}

const editGoal = (goal) => {
  editingGoal.value = goal
  goalForm.value = {
    id: goal.id,
    title: goal.rawData.title,
    description: goal.rawData.description || '',
    targetAmount: goal.rawData.targetAmount,
    currentAmount: goal.rawData.currentAmount,
    deadline: format(new Date(goal.rawData.deadline), 'yyyy-MM-dd'),
    category: goal.rawData.category || 'general'
  }
  showAddModal.value = true
}

const deleteGoal = async (goal) => {
  if (!confirm(`Are you sure you want to delete "${goal.title}"?`)) {
    return
  }
  
  try {
    await api.delete(`/goals/${goal.id}`)
    toast.success('Goal deleted successfully!')
    fetchGoals()
  } catch (error) {
    console.error('Error deleting goal:', error)
    toast.error('Failed to delete goal')
  }
}

onMounted(() => {
  fetchGoals()
})
</script>

<style lang="scss" scoped>
.goals-page {
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

.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
}

.goal-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s;
  
  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-4px);
  }
  
  .goal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-lg);
    
    h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      flex: 1;
    }
    
    .goal-actions {
      display: flex;
      gap: var(--spacing-sm);
    }
  }
  
  .goal-amount {
    margin-bottom: var(--spacing-lg);
    
    .current-amount {
      font-size: 2.5rem;
      font-weight: 900;
      color: var(--primary);
      line-height: 1;
      margin-bottom: var(--spacing-xs);
    }
    
    .target-amount {
      color: var(--text-secondary);
      font-size: 1rem;
    }
  }
  
  .goal-progress {
    margin-bottom: var(--spacing-lg);
    
    .progress-bar {
      height: 12px;
      background: var(--bg-secondary);
      border-radius: var(--radius-full);
      overflow: hidden;
      margin-bottom: var(--spacing-sm);
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%);
        border-radius: var(--radius-full);
        transition: width 0.3s ease;
      }
    }
    
    .progress-label {
      text-align: right;
      font-weight: 700;
      color: var(--primary);
      font-size: 0.875rem;
    }
  }
  
  .goal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--border-color);
    
    .goal-deadline {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
    
    .goal-status {
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      
      &.status-success {
        background: var(--success-light);
        color: var(--success);
      }
      
      &.status-warning {
        background: var(--warning-light);
        color: var(--warning);
      }
      
      &.status-danger {
        background: var(--danger-light);
        color: var(--danger);
      }
    }
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-md);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
  
  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
  
  .btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
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
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  border-top: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: var(--spacing-lg);
  
  label {
    display: block;
    margin-bottom: var(--spacing-sm);
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.875rem;
  }
  
  .form-control {
    width: 100%;
    padding: var(--spacing-md);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 1rem;
    transition: all 0.2s;
    background: var(--bg-primary);
    color: var(--text-primary);
    
    &:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    
    &::placeholder {
      color: var(--text-secondary);
    }
  }
  
  textarea.form-control {
    resize: vertical;
    min-height: 80px;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: var(--primary);
  color: white;
  
  &:hover:not(:disabled) {
    background: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  
  &:hover:not(:disabled) {
    background: var(--border-color);
  }
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.75rem;
}

.btn-icon {
  padding: var(--spacing-xs);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  color: var(--text-primary);
  
  &:hover {
    background: var(--border-color);
  }
  
  &.btn-danger {
    &:hover {
      background: var(--danger-light);
      color: var(--danger);
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    .header-content h1 {
      font-size: 1.5rem;
    }
  }
  
  .goals-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    max-height: 95vh;
  }
}
</style>
