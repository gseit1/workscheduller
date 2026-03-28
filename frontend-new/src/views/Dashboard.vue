<template>
  <div class="dashboard-page">
    <div class="container">
      <!-- PWA Install Banner -->
      <div v-if="showInstallBanner" class="install-banner">
        <div class="install-banner-content">
          <div class="install-banner-icon">
            <i class="bi bi-app-indicator"></i>
          </div>
          <div class="install-banner-text">
            <h4>Install Job Analytics</h4>
            <p>Get quick access and work offline. Install our app now!</p>
          </div>
          <div class="install-banner-actions">
            <button @click="installApp" class="btn btn-install">
              <i class="bi bi-download"></i>
              Install
            </button>
            <button @click="dismissBanner" class="btn-close-banner">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle">Welcome back, {{ user?.username || user?.name || 'User' }}!</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary">
              <i class="bi bi-download"></i>
              Export
            </button>
            <button class="btn btn-primary">
              <i class="bi bi-plus-lg"></i>
              Add Work
            </button>
          </div>
        </div>
      </header>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="dashboard-content">
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon earnings">
                <i class="bi bi-cash-stack"></i>
              </div>
              <span class="stat-trend positive">
                <i class="bi bi-arrow-up"></i> 12.5%
              </span>
            </div>
            <div class="stat-value">€{{ formatAmount(stats.totalEarnings) }}</div>
            <div class="stat-label">Total Earnings</div>
            <div class="stat-footer">
              <span class="stat-detail">This month</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon hours">
                <i class="bi bi-clock"></i>
              </div>
              <span class="stat-trend positive">
                <i class="bi bi-arrow-up"></i> 8.3%
              </span>
            </div>
            <div class="stat-value">{{ stats.totalHours }}h</div>
            <div class="stat-label">Hours Worked</div>
            <div class="stat-footer">
              <span class="stat-detail">{{ stats.daysWorked }} days this month</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon rate">
                <i class="bi bi-graph-up"></i>
              </div>
              <span class="stat-trend neutral">
                <i class="bi bi-dash"></i> 0%
              </span>
            </div>
            <div class="stat-value">€{{ user?.hourlyRate || 0 }}</div>
            <div class="stat-label">Hourly Rate</div>
            <div class="stat-footer">
              <button class="stat-action" @click="showRateModal = true">
                Update rate
              </button>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon goals">
                <i class="bi bi-bullseye"></i>
              </div>
              <span class="stat-trend positive">
                <i class="bi bi-arrow-up"></i> 15%
              </span>
            </div>
            <div class="stat-value">{{ stats.completionRate }}%</div>
            <div class="stat-label">Completion Rate</div>
            <div class="stat-footer">
              <span class="stat-detail">Monthly target</span>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
          <div class="chart-card">
            <div class="chart-header">
              <h3>Earnings Overview</h3>
              <select v-model="earningsPeriod" @change="fetchChartData" class="chart-period">
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div class="chart-container">
              <div v-if="earningsChartData.length > 0" class="earnings-chart">
                <div 
                  v-for="(item, index) in earningsChartData" 
                  :key="index"
                  class="earnings-bar-group"
                >
                  <div class="earnings-bars-container">
                    <div class="earnings-bars">
                      <div 
                        class="earnings-bar"
                        :style="{ height: getEarningsBarHeight(item.earnings) }"
                        :title="`€${formatAmount(item.earnings)}`"
                      >
                        <span class="bar-value">€{{ Math.round(item.earnings) }}</span>
                      </div>
                    </div>
                  </div>
                  <span class="earnings-label">{{ item.label }}</span>
                </div>
              </div>
              <div v-else class="chart-placeholder">
                <i class="bi bi-bar-chart-line"></i>
                <p>No earnings data available</p>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <h3>Hours Distribution</h3>
              <select v-model="hoursPeriod" @change="fetchChartData" class="chart-period">
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div class="chart-container">
              <div v-if="hoursChartData.length > 0" class="hours-chart">
                <div 
                  v-for="(item, index) in hoursChartData" 
                  :key="index"
                  class="hours-segment"
                  :style="{ 
                    '--percentage': `${item.percentage}%`,
                    '--color': item.color,
                    '--rotation': `${calculateRotation(index)}deg`
                  }"
                >
                  <div class="segment-info">
                    <div class="segment-color" :style="{ background: item.color }"></div>
                    <span class="segment-label">{{ item.day }}</span>
                    <span class="segment-value">{{ item.hours }}h ({{ item.percentage }}%)</span>
                  </div>
                </div>
              </div>
              <div v-else class="chart-placeholder">
                <i class="bi bi-pie-chart"></i>
                <p>No hours data available</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="activity-section">
          <div class="section-header">
            <h3>Recent Activity</h3>
            <a href="/work" class="view-all">View all →</a>
          </div>
          <div class="activity-list">
            <div v-if="recentActivity.length === 0 && !loading" class="empty-activity">
              <i class="bi bi-inbox"></i>
              <p>No recent activity</p>
            </div>
            <div v-else v-for="activity in recentActivity" :key="activity.id" class="activity-item">
              <div class="activity-icon" :class="activity.type">
                <i class="bi" :class="activity.type === 'work' ? 'bi-briefcase' : 'bi-wallet2'"></i>
              </div>
              <div class="activity-content">
                <div class="activity-title">{{ activity.description }}</div>
                <div class="activity-meta">
                  <span :class="activity.amount >= 0 ? 'positive' : 'negative'">
                    €{{ formatAmount(Math.abs(activity.amount)) }}
                  </span>
                </div>
              </div>
              <div class="activity-time">{{ activity.date }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Rate Modal -->
    <div v-if="showRateModal" class="modal-overlay" @click.self="showRateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Update Hourly Rate</h3>
          <button class="modal-close" @click="showRateModal = false">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>New Hourly Rate (€)</label>
            <input
              type="number"
              step="0.01"
              v-model="newRate"
              class="form-input"
              placeholder="15.00"
            />
          </div>
          <div class="form-group">
            <label>Effective From</label>
            <input
              type="date"
              v-model="effectiveDate"
              class="form-input"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showRateModal = false">Cancel</button>
          <button class="btn btn-primary" @click="updateRate" :disabled="updating">
            <span v-if="updating" class="spinner" style="width: 16px; height: 16px;"></span>
            {{ updating ? 'Updating...' : 'Update Rate' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

const toast = useToast()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const loading = ref(true)

// PWA Install Banner
const showInstallBanner = ref(false)
const deferredPrompt = ref(null)

// Check for install prompt
onMounted(() => {
  // Check if already dismissed
  const dismissed = localStorage.getItem('install-banner-dismissed')
  const dismissedTime = dismissed ? parseInt(dismissed) : 0
  const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)

  // Show banner if not dismissed in last 7 days
  if (!dismissed || daysSinceDismissed > 7) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt.value = e
      showInstallBanner.value = true
    })
  }
})

const installApp = async () => {
  if (!deferredPrompt.value) return

  try {
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    
    if (outcome === 'accepted') {
      toast.success('Thanks for installing Job Analytics! 🎉')
      showInstallBanner.value = false
    }
    
    deferredPrompt.value = null
  } catch (error) {
    console.error('Install error:', error)
  }
}

const dismissBanner = () => {
  showInstallBanner.value = false
  localStorage.setItem('install-banner-dismissed', Date.now().toString())
  toast.info('You can install the app anytime from Settings')
}
const stats = ref({
  totalEarnings: 0,
  totalHours: 0,
  daysWorked: 0,
  completionRate: 0
})

const recentActivity = ref([])

// Chart data
const earningsPeriod = ref('month')
const hoursPeriod = ref('week')
const earningsChartData = ref([])
const hoursChartData = ref([])

const showRateModal = ref(false)
const newRate = ref(user.value?.hourlyRate || 15)
const effectiveDate = ref(format(new Date(), 'yyyy-MM-dd'))
const updating = ref(false)

const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-IE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0)
}

const formatRelativeDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return format(date, 'MMM d, yyyy')
}

const fetchDashboard = async () => {
  try {
    loading.value = true
    const response = await api.get('/dashboard/overview')
    const data = response.data
    
    console.log('Dashboard API Response:', data)
    console.log('Current Month Work:', data.currentMonth?.work)
    console.log('Total Earnings:', data.currentMonth?.work?.totalEarnings)
    
    // Update stats from API - MongoDB format
    stats.value = {
      totalEarnings: data.currentMonth?.work?.totalEarnings || 0,
      totalHours: data.currentMonth?.work?.totalHours || 0,
      daysWorked: data.currentMonth?.work?.daysWorked || 0,
      completionRate: calculateCompletionRate(data.currentMonth?.work)
    }
    
    console.log('Stats after update:', stats.value)
    
    // Build activity list from recent work days
    const activities = []
    
    if (data.recentActivity && Array.isArray(data.recentActivity)) {
      data.recentActivity.forEach(day => {
        activities.push({
          id: `work-${day._id}`,
          type: 'work',
          description: `Worked ${day.hoursWorked} hours`,
          amount: (day.hoursWorked * day.hourlyRate) + (day.tipsAmount || 0),
          date: formatRelativeDate(day.workDate)
        })
      })
    }
    
    recentActivity.value = activities.slice(0, 5)
    
    // Fetch chart data
    await fetchChartData()
    
  } catch (error) {
    console.error('Failed to fetch dashboard', error)
    toast.error('Failed to load dashboard data')
  } finally {
    loading.value = false
  }
}

const fetchChartData = async () => {
  try {
    // Fetch work days for charts
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    // Get work days for current month
    const workResponse = await api.get('/work/days', {
      params: {
        month: currentMonth,
        year: currentYear
      }
    })
    
    const workDays = workResponse.data.workDays || []
    
    // Process earnings chart data based on period
    if (earningsPeriod.value === 'week') {
      earningsChartData.value = processWeeklyEarnings(workDays)
    } else if (earningsPeriod.value === 'month') {
      earningsChartData.value = processDailyEarnings(workDays, 'month')
    } else {
      // Year view - fetch yearly data
      const yearlyResponse = await api.get('/dashboard/yearly', {
        params: { year: currentYear }
      })
      earningsChartData.value = processYearlyEarnings(yearlyResponse.data.monthlyData || [])
    }
    
    // Process hours distribution based on period
    if (hoursPeriod.value === 'week') {
      hoursChartData.value = processWeeklyHours(workDays)
    } else {
      hoursChartData.value = processMonthlyHours(workDays)
    }
    
  } catch (error) {
    console.error('Failed to fetch chart data', error)
  }
}

const processWeeklyEarnings = (workDays) => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - dayOfWeek)
  
  const weekData = []
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    const dateStr = format(date, 'yyyy-MM-dd')
    
    const dayWork = workDays.filter(w => format(new Date(w.workDate), 'yyyy-MM-dd') === dateStr)
    const earnings = dayWork.reduce((sum, w) => sum + (w.hoursWorked * w.hourlyRate) + (w.tipsAmount || 0), 0)
    
    weekData.push({
      label: days[i],
      earnings: earnings
    })
  }
  
  return weekData
}

const processDailyEarnings = (workDays, period) => {
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const monthData = []
  
  // Group by week for better visualization
  const weeksInMonth = Math.ceil(daysInMonth / 7)
  
  for (let week = 0; week < weeksInMonth; week++) {
    const startDay = week * 7 + 1
    const endDay = Math.min((week + 1) * 7, daysInMonth)
    
    const weekWork = workDays.filter(w => {
      const day = new Date(w.workDate).getDate()
      return day >= startDay && day <= endDay
    })
    
    const earnings = weekWork.reduce((sum, w) => sum + (w.hoursWorked * w.hourlyRate) + (w.tipsAmount || 0), 0)
    
    monthData.push({
      label: `W${week + 1}`,
      earnings: earnings
    })
  }
  
  return monthData
}

const processYearlyEarnings = (monthlyData) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return monthlyData.map(m => ({
    label: months[m.month - 1],
    earnings: m.earnings + m.tips
  }))
}

const processWeeklyHours = (workDays) => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - dayOfWeek)
  
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const hoursData = []
  let totalHours = 0
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    const dateStr = format(date, 'yyyy-MM-dd')
    
    const dayWork = workDays.filter(w => format(new Date(w.workDate), 'yyyy-MM-dd') === dateStr)
    const hours = dayWork.reduce((sum, w) => sum + w.hoursWorked, 0)
    totalHours += hours
    
    if (hours > 0) {
      hoursData.push({
        day: days[i],
        hours: hours,
        color: colors[i],
        percentage: 0 // Will calculate after we have total
      })
    }
  }
  
  // Calculate percentages
  hoursData.forEach(item => {
    item.percentage = totalHours > 0 ? Math.round((item.hours / totalHours) * 100) : 0
  })
  
  return hoursData
}

const processMonthlyHours = (workDays) => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  const hoursData = []
  let totalHours = 0
  
  // Group by week
  const weekGroups = {}
  
  workDays.forEach(w => {
    const date = new Date(w.workDate)
    const weekNum = Math.ceil(date.getDate() / 7)
    if (!weekGroups[weekNum]) {
      weekGroups[weekNum] = 0
    }
    weekGroups[weekNum] += w.hoursWorked
    totalHours += w.hoursWorked
  })
  
  Object.keys(weekGroups).forEach((week, index) => {
    hoursData.push({
      day: `Week ${week}`,
      hours: weekGroups[week],
      color: colors[index % colors.length],
      percentage: totalHours > 0 ? Math.round((weekGroups[week] / totalHours) * 100) : 0
    })
  })
  
  return hoursData
}

const getEarningsBarHeight = (earnings) => {
  if (!earnings || earnings === 0) return '0px'
  const maxEarnings = Math.max(...earningsChartData.value.map(d => d.earnings), 1)
  const percentage = (earnings / maxEarnings) * 100
  return `${Math.max(Math.min(percentage, 95), 8)}%`
}

const calculateRotation = (index) => {
  return 0 // Not used for list view, but kept for compatibility
}

const calculateCompletionRate = (workData) => {
  if (!workData) return 0
  const daysWorked = workData.daysWorked || 0
  const currentDate = new Date()
  const daysPassed = currentDate.getDate()
  const expectedDays = Math.floor(daysPassed / 7 * 5) // Assuming 5 work days per week
  return expectedDays > 0 ? Math.round((daysWorked / expectedDays) * 100) : 0
}

const updateRate = async () => {
  try {
    updating.value = true
    const result = await authStore.updateHourlyRate(newRate.value, effectiveDate.value)
    if (result.success) {
      toast.success('Hourly rate updated successfully')
      showRateModal.value = false
      await fetchDashboard()
    } else {
      toast.error(result.message)
    }
  } catch (error) {
    toast.error('Failed to update rate')
  } finally {
    updating.value = false
  }
}

onMounted(() => {
  fetchDashboard()
})
</script>

<style lang="scss" scoped>
.dashboard-page {
  min-height: 100vh;
  padding: var(--spacing-xl) 0;
  padding-bottom: calc(var(--spacing-xl) + 5rem + env(safe-area-inset-bottom));
  background: var(--bg-secondary);
}

// PWA Install Banner
.install-banner {
  margin-bottom: var(--spacing-xl);
  animation: slideDown 0.3s ease-out;

  .install-banner-content {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 12px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
  }

  .install-banner-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    i {
      font-size: 24px;
      color: white;
    }
  }

  .install-banner-text {
    flex: 1;

    h4 {
      font-size: 18px;
      font-weight: 700;
      color: white;
      margin: 0 0 4px 0;
    }

    p {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
    }
  }

  .install-banner-actions {
    display: flex;
    gap: 12px;
    flex-shrink: 0;
  }

  .btn-install {
    background: white;
    color: #6366f1;
    border: none;
    padding: 10px 24px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    i {
      font-size: 16px;
    }
  }

  .btn-close-banner {
    background: rgba(255, 255, 255, 0.2);
    color: white;
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
      background: rgba(255, 255, 255, 0.3);
    }

    i {
      font-size: 14px;
    }
  }

  @media (max-width: 768px) {
    .install-banner-content {
      flex-direction: column;
      text-align: center;
      padding: 16px 20px;
    }

    .install-banner-actions {
      width: 100%;

      .btn-install {
        flex: 1;
      }
    }
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  margin-bottom: var(--spacing-2xl);
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--spacing-lg);
  }
  
  .page-title {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }
  
  .page-subtitle {
    font-size: 1rem;
    color: var(--text-secondary);
  }
  
  .header-actions {
    display: flex;
    gap: var(--spacing-md);

    .btn {
      min-height: 44px;
      white-space: nowrap;
    }
  }
  
  @media (max-width: 767px) {
    .page-title {
      font-size: 1.5rem;
    }
    
    .header-actions {
      width: 100%;
      
      .btn {
        flex: 1;
      }
    }
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-md);
  
  p {
    color: var(--text-secondary);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.stat-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-light);
  transition: all var(--transition-fast);
  
  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
  
  .stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-md);
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    
    &.earnings {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }
    
    &.hours {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }
    
    &.rate {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }
    
    &.goals {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
    }
  }
  
  .stat-trend {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-full);
    
    &.positive {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
    }
    
    &.negative {
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger);
    }
    
    &.neutral {
      background: var(--bg-tertiary);
      color: var(--text-tertiary);
    }
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-md);
  }
  
  .stat-footer {
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--border-light);
    
    .stat-detail {
      font-size: 0.8125rem;
      color: var(--text-tertiary);
    }
    
    .stat-action {
      background: none;
      border: none;
      color: var(--primary);
      font-weight: 600;
      font-size: 0.8125rem;
      cursor: pointer;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
  
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-light);
  overflow: hidden;
  
  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-lg);
    
    h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .chart-period {
      padding: 0.5rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      background: var(--bg-primary);
      color: var(--text-primary);
      cursor: pointer;
      
      &:focus {
        outline: none;
        border-color: var(--primary);
      }
    }
  }
  
  .chart-container {
    height: 250px;
    overflow-x: auto;
  }
  
  .chart-placeholder {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    color: var(--text-tertiary);
    
    i {
      font-size: 3rem;
    }
  }
  
  .earnings-chart {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--spacing-xs);
    height: 100%;
    min-width: 420px;
    padding: var(--spacing-md) 0;
    border-bottom: 2px solid var(--border-light);
    
    .earnings-bar-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-sm);
      min-width: 0;
      
      .earnings-bars-container {
        flex: 1;
        width: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        
        .earnings-bars {
          display: flex;
          align-items: flex-end;
          height: 100%;
          
          .earnings-bar {
            position: relative;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding-top: 4px;
            border-radius: 6px 6px 0 0;
            background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
            transition: all 0.3s ease;
            cursor: pointer;
            min-height: 8px;
            width: clamp(20px, 5vw, 40px);
            
            .bar-value {
              font-size: 0.625rem;
              font-weight: 700;
              color: white;
              white-space: nowrap;
              opacity: 0;
              transition: opacity 0.2s ease;
            }
            
            &:hover {
              opacity: 0.9;
              transform: translateY(-2px);
              
              .bar-value {
                opacity: 1;
              }
            }
          }
        }
      }
      
      .earnings-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        font-weight: 600;
        text-align: center;
        white-space: nowrap;
      }
    }
  }
  
  .hours-chart {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) 0;
    
    .hours-segment {
      display: flex;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      border-left: 4px solid var(--color);
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateX(4px);
        box-shadow: var(--shadow-sm);
      }
      
      .segment-info {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        width: 100%;
        
        .segment-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .segment-label {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.875rem;
          min-width: 80px;
        }
        
        .segment-value {
          margin-left: auto;
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 600;
        }
      }
    }
  }
}

.activity-section {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-light);
  
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-lg);
    
    h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .view-all {
      color: var(--primary);
      font-weight: 600;
      font-size: 0.875rem;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
  
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .activity-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    transition: background var(--transition-fast);
    
    &:hover {
      background: var(--bg-secondary);
    }
    
    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: var(--bg-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
      font-size: 1.125rem;
      flex-shrink: 0;
    }
    
    .activity-content {
      flex: 1;
      
      .activity-title {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
      }
      
      .activity-meta {
        font-size: 0.875rem;
        color: var(--text-tertiary);
        
        .separator {
          margin: 0 0.5rem;
        }
      }
    }
    
    .activity-time {
      font-size: 0.8125rem;
      color: var(--text-tertiary);
      flex-shrink: 0;
    }
  }
}

@media (max-width: 1024px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding-top: var(--spacing-lg);
  }

  .page-header {
    margin-bottom: var(--spacing-xl);

    .header-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-sm);

      .btn {
        width: 100%;
      }
    }
  }

  .stats-grid {
    gap: var(--spacing-sm);
  }

  .stat-card {
    padding: var(--spacing-md);

    .stat-value {
      font-size: 1.55rem;
    }
  }

  .chart-card {
    padding: var(--spacing-md);

    .chart-header {
      flex-direction: column;
      align-items: stretch;
      gap: var(--spacing-sm);

      h3 {
        font-size: 1rem;
      }

      .chart-period {
        width: 100%;
        min-height: 42px;
      }
    }

    .chart-container {
      height: 220px;
    }
  }

  .hours-chart .hours-segment .segment-info {
    gap: var(--spacing-sm);

    .segment-label {
      min-width: 0;
    }
  }

  .activity-section {
    padding: var(--spacing-md);

    .activity-item {
      align-items: flex-start;
      gap: var(--spacing-sm);

      .activity-content {
        min-width: 0;
      }

      .activity-time {
        font-size: 0.75rem;
      }
    }
  }
}

@media (max-width: 520px) {
  .dashboard-page {
    padding-top: var(--spacing-md);
  }

  .install-banner {
    .install-banner-content {
      border-radius: var(--radius-lg);
    }

    .install-banner-actions {
      flex-direction: row;

      .btn-install {
        min-height: 44px;
      }
    }
  }

  .page-header {
    .header-content {
      .page-title {
        font-size: 1.35rem;
      }

      .page-subtitle {
        font-size: 0.9rem;
      }
    }

    .header-actions {
      grid-template-columns: 1fr;
    }
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .chart-card .chart-container {
    height: 200px;
  }

  .activity-section .section-header {
    align-items: center;

    h3 {
      font-size: 1rem;
    }
  }
}

// Modal
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
  z-index: 9999;
  padding: var(--spacing-lg);
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  max-width: 500px;
  width: 100%;
  box-shadow: var(--shadow-xl);
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--border-light);
    
    h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .modal-close {
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
    border-top: 1px solid var(--border-light);
  }
}

.form-group {
  margin-bottom: var(--spacing-lg);
  
  label {
    display: block;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
    font-size: 0.875rem;
  }
  
  .form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-size: 1rem;
    transition: all var(--transition-fast);
    
    &:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  }
}
</style>
