<template>
  <div class="expenses-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Expenses</h1>
        <p>Track and manage your business expenses</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="showAddModal = true">
          <i class="bi bi-plus-circle"></i>
          <span>Add Expense</span>
        </button>
      </div>
    </div>

    <div class="expenses-summary">
      <div class="summary-card">
        <div class="summary-icon">
          <i class="bi bi-cash-stack"></i>
        </div>
        <div class="summary-content">
          <span class="summary-label">Total Expenses</span>
          <span class="summary-value">€{{ monthlyStats.totalExpenses }}</span>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="summary-icon">
          <i class="bi bi-receipt"></i>
        </div>
        <div class="summary-content">
          <span class="summary-label">Number of Expenses</span>
          <span class="summary-value">{{ monthlyStats.expenseCount }}</span>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="summary-icon">
          <i class="bi bi-bar-chart"></i>
        </div>
        <div class="summary-content">
          <span class="summary-label">Average Expense</span>
          <span class="summary-value">€{{ monthlyStats.averageExpense }}</span>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon">
          <i class="bi bi-piggy-bank"></i>
        </div>
        <div class="summary-content">
          <span class="summary-label">Net Income</span>
          <span class="summary-value" :class="netIncomeClass">€{{ monthlyStats.netIncome }}</span>
        </div>
      </div>
    </div>

    <div class="expenses-content">
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
        
        <div class="filter-group">
          <label>Type</label>
          <select v-model="typeFilter" class="form-select">
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <div class="expenses-table">
        <div v-if="expenses.length === 0" class="empty-state">
          <i class="bi bi-inbox"></i>
          <h3>No expenses yet</h3>
          <p>Start by adding your first expense for this month</p>
          <button class="btn btn-primary" @click="showAddModal = true">
            <i class="bi bi-plus-circle"></i>
            Add Expense
          </button>
        </div>

        <table v-else>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="expense in expenses" :key="expense.id">
              <td>{{ expense.date }}</td>
              <td>{{ expense.description }}</td>
              <td>
                <span :class="['badge', `badge-${expense.type}`]">
                  {{ expense.type }}
                </span>
              </td>
              <td :class="['amount', expense.type === 'income' ? 'income' : 'expense']">
                {{ expense.type === 'income' ? '+' : '-' }}€{{ expense.amount }}
              </td>
              <td class="actions">
                <button @click="editExpense(expense)" class="btn btn-sm btn-icon">
                  <i class="bi bi-pencil"></i>
                </button>
                <button @click="deleteExpense(expense)" class="btn btn-sm btn-icon btn-danger">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Expense Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingExpense ? 'Edit Entry' : 'Add Entry' }}</h3>
          <button class="btn-close" @click="closeModal">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Date</label>
            <input 
              v-model="expenseForm.expenseDate" 
              type="date" 
              class="form-control"
              required
            />
          </div>
          <div class="form-group">
            <label>Type</label>
            <select v-model="expenseForm.type" class="form-control">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div class="form-group">
            <label>Category</label>
            <select v-model="expenseForm.category" class="form-control">
              <option value="food">Food & Dining</option>
              <option value="transport">Transportation</option>
              <option value="utilities">Utilities</option>
              <option value="entertainment">Entertainment</option>
              <option value="shopping">Shopping</option>
              <option value="health">Health</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Description</label>
            <input 
              v-model="expenseForm.description" 
              type="text" 
              class="form-control"
              placeholder="e.g., Office supplies"
              required
            />
          </div>
          <div class="form-group">
            <label>Amount (€)</label>
            <input 
              v-model.number="expenseForm.amount" 
              type="number" 
              step="0.01"
              min="0"
              class="form-control"
              required
            />
          </div>
          <div class="form-group">
            <label>Notes (Optional)</label>
            <textarea 
              v-model="expenseForm.notes" 
              class="form-control"
              rows="3"
              placeholder="Any additional details..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button class="btn btn-primary" @click="saveExpense" :disabled="!expenseForm.expenseDate || !expenseForm.description || !expenseForm.amount || !expenseForm.category">
            {{ editingExpense ? 'Update' : 'Add' }}
          </button>
        </div>
      </div>
    </div>
    <!-- End Modal -->
  </div>
  
  </template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '../services/api'
import { useToast } from 'vue-toastification'
import { format, addMonths, subMonths } from 'date-fns'

const toast = useToast()
const showAddModal = ref(false)
const editingExpense = ref(null)
const currentDate = ref(new Date())
const typeFilter = ref('expense')
const expenses = ref([])
const loading = ref(false)

// Monthly statistics
const monthlyStats = ref({
  totalExpenses: 0,
  expenseCount: 0,
  averageExpense: 0,
  netIncome: 0
})

// Expense form
const expenseForm = ref({
  id: null,
  expenseDate: format(new Date(), 'yyyy-MM-dd'),
  type: 'expense',
  category: 'other',
  description: '',
  amount: 0,
  notes: ''
})

const currentMonthLabel = computed(() => {
  return format(currentDate.value, 'MMMM yyyy')
})

const netIncomeClass = computed(() => {
  return monthlyStats.value.netIncome >= 0 ? 'positive' : 'negative'
})

const previousMonth = () => {
  currentDate.value = subMonths(currentDate.value, 1)
  fetchExpenses()
  fetchMonthlyStats()
}

const nextMonth = () => {
  currentDate.value = addMonths(currentDate.value, 1)
  fetchExpenses()
  fetchMonthlyStats()
}

const goToCurrentMonth = () => {
  currentDate.value = new Date()
  fetchExpenses()
  fetchMonthlyStats()
}

const fetchMonthlyStats = async () => {
  try {
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()
    
    // Fetch expenses
    const expenseResponse = await api.get('/expenses', {
      params: { month, year, type: 'expense' }
    })
    const expenseData = expenseResponse.data.expenses || []
    
    // Fetch work earnings for net income calculation
    const workResponse = await api.get('/work/days', {
      params: { month, year }
    })
    const workData = workResponse.data.workDays || []
    
    // Calculate stats
    const totalExpenses = expenseData.reduce((sum, exp) => sum + exp.amount, 0)
    const expenseCount = expenseData.length
    const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0
    
    // Calculate total earnings
    let totalEarnings = 0
    workData.forEach(day => {
      totalEarnings += (day.hoursWorked * day.hourlyRate) + (day.tipsAmount || 0)
    })
    
    const netIncome = totalEarnings - totalExpenses
    
    monthlyStats.value = {
      totalExpenses: totalExpenses.toFixed(2),
      expenseCount: expenseCount,
      averageExpense: averageExpense.toFixed(2),
      netIncome: netIncome.toFixed(2)
    }
  } catch (error) {
    console.error('Error fetching monthly stats:', error)
  }
}

const fetchExpenses = async () => {
  try {
    loading.value = true
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()
    
    let params = { month, year }
    
    if (typeFilter.value !== 'all') {
      params.type = typeFilter.value
    }
    
    const response = await api.get('/expenses', { params })
    const expensesData = response.data.expenses || []
    expenses.value = expensesData.map(expense => ({
      id: expense._id,
      date: format(new Date(expense.expenseDate), 'MMM d, yyyy'),
      description: expense.description,
      type: expense.type || 'expense',
      amount: expense.amount.toFixed(2),
      rawData: expense
    }))
  } catch (error) {
    console.error('Error fetching expenses:', error)
    toast.error('Failed to load expenses')
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  showAddModal.value = false
  editingExpense.value = null
  expenseForm.value = {
    id: null,
    expenseDate: format(new Date(), 'yyyy-MM-dd'),
    type: 'expense',
    category: 'other',
    description: '',
    amount: 0,
    notes: ''
  }
}

const saveExpense = async () => {
  try {
    const payload = {
      expenseDate: expenseForm.value.expenseDate,
      type: expenseForm.value.type,
      category: expenseForm.value.category,
      description: expenseForm.value.description,
      amount: parseFloat(expenseForm.value.amount),
      notes: expenseForm.value.notes || ''
    }

    if (editingExpense.value) {
      await api.put(`/expenses/${expenseForm.value.id}`, payload)
      toast.success('Entry updated successfully!')
    } else {
      await api.post('/expenses', payload)
      toast.success('Entry added successfully!')
    }
    
    closeModal()
    fetchExpenses()
    fetchMonthlyStats()
  } catch (error) {
    console.error('Error saving expense:', error)
    toast.error(error.response?.data?.error || 'Failed to save entry')
  }
}

const editExpense = (expense) => {
  editingExpense.value = expense
  expenseForm.value = {
    id: expense.id,
    expenseDate: format(new Date(expense.rawData.expenseDate), 'yyyy-MM-dd'),
    type: expense.rawData.type || 'expense',
    category: expense.rawData.category || 'other',
    description: expense.rawData.description,
    amount: expense.rawData.amount,
    notes: expense.rawData.notes || ''
  }
  showAddModal.value = true
}

const deleteExpense = async (expense) => {
  if (!confirm('Are you sure you want to delete this entry?')) return
  
  try {
    await api.delete(`/expenses/${expense.id}`)
    toast.success('Entry deleted successfully!')
    fetchExpenses()
    fetchMonthlyStats()
  } catch (error) {
    console.error('Error deleting expense:', error)
    toast.error('Failed to delete entry')
  }
}

watch(typeFilter, () => {
  fetchExpenses()
})

onMounted(() => {
  fetchExpenses()
  fetchMonthlyStats()
})
</script>

<style lang="scss" scoped>
.expenses-page {
  max-width: 1400px;
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

.expenses-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  
  .summary-card {
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
    
    .summary-icon {
      width: 60px;
      height: 60px;
      border-radius: var(--radius-md);
      background: var(--danger-light);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--danger);
      font-size: 1.5rem;
    }
    
    .summary-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      
      .summary-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        font-weight: 500;
      }
      
      .summary-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);

        &.positive {
          color: var(--success);
        }

        &.negative {
          color: var(--danger);
        }
      }
    }
  }
}

.filters-bar {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
  
  .filter-group {
    flex: 1;
    min-width: 200px;
    
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

.expenses-table {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;

  .empty-state {
    text-align: center;
    padding: var(--spacing-3xl) var(--spacing-xl);
    
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
  
  table {
    width: 100%;
    border-collapse: collapse;
    
    thead {
      background: var(--bg-secondary);
      
      th {
        padding: var(--spacing-md) var(--spacing-lg);
        text-align: left;
        font-weight: 600;
        color: var(--text-secondary);
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }
    
    tbody {
      tr {
        border-bottom: 1px solid var(--border-color);
        transition: background-color 0.2s;
        
        &:hover {
          background: var(--bg-secondary);
        }
        
        &:last-child {
          border-bottom: none;
        }
        
        td {
          padding: var(--spacing-md) var(--spacing-lg);
          color: var(--text-primary);
          
          &.amount {
            font-weight: 700;

            &.expense {
              color: var(--danger);
            }

            &.income {
              color: var(--success);
            }
          }
          
          &.actions {
            display: flex;
            gap: var(--spacing-sm);
          }
          
          .badge {
            display: inline-block;
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--radius-full);
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: capitalize;
            
            &.badge-expense {
              background: var(--danger-light);
              color: var(--danger);
            }
            
            &.badge-income {
              background: var(--success-light);
              color: var(--success);
            }
          }
        }
      }
    }
  }
}

// Modal styles
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
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  
  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
  
  .btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    
    &:hover {
      background: var(--bg-secondary);
    }
  }
}

.modal-body {
  padding: var(--spacing-lg);
}

.modal-footer {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: var(--spacing-md);
  
  label {
    display: block;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }
  
  .form-control {
    width: 100%;
    padding: var(--spacing-sm);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: var(--primary);
    }
  }
  
  textarea.form-control {
    resize: vertical;
    min-height: 80px;
  }
}

@media (max-width: 768px) {
  .page-header {
    .header-content h1 {
      font-size: 1.5rem;
    }
  }
  
  .expenses-table {
    overflow-x: auto;
    
    table {
      min-width: 600px;
    }
  }
}
</style>
