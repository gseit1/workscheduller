<template>
  <div class="analytics-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Analytics</h1>
        <p>Detailed insights into your work and earnings</p>
      </div>
      <div class="header-actions">
        <select v-model="selectedYear" @change="fetchAnalytics" class="year-select">
          <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
        </select>
        <div class="period-tabs">
          <button 
            v-for="period in periods" 
            :key="period.value"
            :class="['period-tab', { active: periodFilter === period.value }]"
            @click="periodFilter = period.value"
          >
            <i :class="period.icon"></i>
            <span>{{ period.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="analytics-content" v-if="!loading">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-currency-dollar"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total Earnings</span>
            <span class="stat-value">{{ formatCurrency(stats.totalEarnings) }}</span>
            <span :class="['stat-change', getChangeClass(stats.earningsChange)]">
              {{ formatChange(stats.earningsChange) }}
            </span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-clock-history"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Hours Worked</span>
            <span class="stat-value">{{ stats.totalHours.toFixed(1) }}</span>
            <span :class="['stat-change', getChangeClass(stats.hoursChange)]">
              {{ formatChange(stats.hoursChange) }}
            </span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-graph-up-arrow"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Avg. Hourly Rate</span>
            <span class="stat-value">{{ formatCurrency(stats.avgRate) }}</span>
            <span :class="['stat-change', getChangeClass(stats.rateChange)]">
              {{ formatChange(stats.rateChange) }}
            </span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-wallet2"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Net Income</span>
            <span class="stat-value">{{ formatCurrency(stats.netIncome) }}</span>
            <span :class="['stat-change', getChangeClass(stats.netChange)]">
              {{ formatChange(stats.netChange) }}
            </span>
          </div>
        </div>
      </div>

      <div class="charts-section">
        <div class="chart-card">
          <h3>Monthly Earnings Trend</h3>
          <div class="chart-container">
            <div v-if="displayedMonths.length > 0" class="bar-chart">
              <div 
                v-for="(month, index) in displayedMonths" 
                :key="index"
                class="bar-group"
              >
                <div class="bars-container">
                  <div class="bars">
                    <div 
                      class="bar earnings"
                      :style="{ height: getBarHeight(month.earnings, maxEarnings) }"
                      :title="`Earnings: ${formatCurrency(month.earnings)}`"
                    >
                      <span class="bar-value" v-if="month.earnings > 0">{{ formatCurrency(month.earnings) }}</span>
                    </div>
                    <div 
                      class="bar tips"
                      :style="{ height: getBarHeight(month.tips, maxEarnings) }"
                      :title="`Tips: ${formatCurrency(month.tips)}`"
                    >
                      <span class="bar-value" v-if="month.tips > 0">{{ formatCurrency(month.tips) }}</span>
                    </div>
                  </div>
                </div>
                <span class="bar-label">{{ getMonthName(month.month) }}</span>
              </div>
            </div>
            <div v-else class="empty-chart">
              <i class="bi bi-bar-chart-line"></i>
              <p>No earnings data for this period</p>
            </div>
            <div v-if="displayedMonths.length > 0" class="chart-legend">
              <div class="legend-item">
                <span class="legend-color earnings"></span>
                <span>Earnings</span>
              </div>
              <div class="legend-item">
                <span class="legend-color tips"></span>
                <span>Tips</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="chart-card">
          <h3>Monthly Hours Distribution</h3>
          <div class="chart-container">
            <div v-if="displayedMonths.length > 0" class="bar-chart">
              <div 
                v-for="(month, index) in displayedMonths" 
                :key="index"
                class="bar-group"
              >
                <div class="bars-container">
                  <div class="bars">
                    <div 
                      class="bar hours"
                      :style="{ height: getBarHeight(month.hours, maxHours) }"
                      :title="`Hours: ${month.hours.toFixed(1)}`"
                    >
                      <span class="bar-value" v-if="month.hours > 0">{{ month.hours.toFixed(1) }}</span>
                    </div>
                  </div>
                </div>
                <span class="bar-label">{{ getMonthName(month.month) }}</span>
              </div>
            </div>
            <div v-else class="empty-chart">
              <i class="bi bi-clock-history"></i>
              <p>No hours data for this period</p>
            </div>
          </div>
        </div>
      </div>

      <div class="insights-section">
        <h3>Key Insights</h3>
        <div class="insights-grid">
          <div class="insight-card">
            <i class="bi bi-trophy"></i>
            <div class="insight-content">
              <h4>Best Performing Month</h4>
              <p>{{ insights.bestMonth.name }} with {{ formatCurrency(insights.bestMonth.earnings) }} earnings</p>
            </div>
          </div>
          
          <div class="insight-card">
            <i class="bi bi-lightning"></i>
            <div class="insight-content">
              <h4>Most Productive Month</h4>
              <p>{{ insights.mostHours.name }} with {{ insights.mostHours.hours.toFixed(1) }} hours worked</p>
            </div>
          </div>
          
          <div class="insight-card">
            <i class="bi bi-star"></i>
            <div class="insight-content">
              <h4>Average Monthly Income</h4>
              <p>{{ formatCurrency(insights.avgMonthlyIncome) }} across all months</p>
            </div>
          </div>

          <div class="insight-card">
            <i class="bi bi-graph-up"></i>
            <div class="insight-content">
              <h4>Total Tips Earned</h4>
              <p>{{ formatCurrency(insights.totalTips) }} in tips this period</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading-state">
      <div class="spinner"></div>
      <p>Loading analytics...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

const toast = useToast()

// State
const loading = ref(true)
const yearlyData = ref([])
const selectedYear = ref(new Date().getFullYear())
const periodFilter = ref('month')

// Period options
const periods = [
  { value: 'month', label: 'Month', icon: 'bi bi-calendar-day' },
  { value: 'quarter', label: 'Quarter', icon: 'bi bi-calendar3' },
  { value: 'year', label: 'Year', icon: 'bi bi-calendar-range' }
]

// Available years (last 5 years)
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - i)
})

// Get current month for filtering
const currentMonth = new Date().getMonth() + 1

// Filter months based on period
const displayedMonths = computed(() => {
  if (!yearlyData.value.length) return []
  
  if (periodFilter.value === 'month') {
    // Current month only
    return yearlyData.value.filter(m => m.month === currentMonth)
  } else if (periodFilter.value === 'quarter') {
    // Current quarter
    const quarter = Math.ceil(currentMonth / 3)
    const startMonth = (quarter - 1) * 3 + 1
    const endMonth = quarter * 3
    return yearlyData.value.filter(m => m.month >= startMonth && m.month <= endMonth)
  } else {
    // Full year
    return yearlyData.value
  }
})

// Calculate stats for displayed period
const stats = computed(() => {
  const months = displayedMonths.value
  if (!months.length) {
    return {
      totalEarnings: 0,
      totalHours: 0,
      avgRate: 0,
      netIncome: 0,
      earningsChange: 0,
      hoursChange: 0,
      rateChange: 0,
      netChange: 0
    }
  }

  const totalEarnings = months.reduce((sum, m) => sum + m.earnings + m.tips, 0)
  const totalHours = months.reduce((sum, m) => sum + m.hours, 0)
  const totalExpenses = months.reduce((sum, m) => sum + m.expenses, 0)
  const netIncome = totalEarnings - totalExpenses
  const avgRate = totalHours > 0 ? totalEarnings / totalHours : 0

  // Calculate changes (compare with previous period)
  let prevMonths = []
  if (periodFilter.value === 'month' && currentMonth > 1) {
    prevMonths = yearlyData.value.filter(m => m.month === currentMonth - 1)
  } else if (periodFilter.value === 'quarter') {
    const quarter = Math.ceil(currentMonth / 3)
    if (quarter > 1) {
      const prevStartMonth = (quarter - 2) * 3 + 1
      const prevEndMonth = (quarter - 1) * 3
      prevMonths = yearlyData.value.filter(m => m.month >= prevStartMonth && m.month <= prevEndMonth)
    }
  }

  const prevEarnings = prevMonths.reduce((sum, m) => sum + m.earnings + m.tips, 0)
  const prevHours = prevMonths.reduce((sum, m) => sum + m.hours, 0)
  const prevExpenses = prevMonths.reduce((sum, m) => sum + m.expenses, 0)
  const prevNet = prevEarnings - prevExpenses
  const prevRate = prevHours > 0 ? prevEarnings / prevHours : 0

  return {
    totalEarnings,
    totalHours,
    avgRate,
    netIncome,
    earningsChange: prevEarnings > 0 ? ((totalEarnings - prevEarnings) / prevEarnings) * 100 : 0,
    hoursChange: prevHours > 0 ? ((totalHours - prevHours) / prevHours) * 100 : 0,
    rateChange: prevRate > 0 ? ((avgRate - prevRate) / prevRate) * 100 : 0,
    netChange: prevNet > 0 ? ((netIncome - prevNet) / prevNet) * 100 : 0
  }
})

// Calculate max values for chart scaling
const maxEarnings = computed(() => {
  const months = displayedMonths.value
  return Math.max(...months.map(m => Math.max(m.earnings, m.tips)), 1)
})

const maxHours = computed(() => {
  const months = displayedMonths.value
  return Math.max(...months.map(m => m.hours), 1)
})

// Calculate insights
const insights = computed(() => {
  const months = displayedMonths.value.filter(m => m.earnings > 0 || m.hours > 0)
  
  if (!months.length) {
    return {
      bestMonth: { name: 'N/A', earnings: 0 },
      mostHours: { name: 'N/A', hours: 0 },
      avgMonthlyIncome: 0,
      totalTips: 0
    }
  }

  const bestMonth = months.reduce((max, m) => {
    const earnings = m.earnings + m.tips
    const maxEarnings = max.earnings + max.tips
    return earnings > maxEarnings ? m : max
  })

  const mostHours = months.reduce((max, m) => m.hours > max.hours ? m : max)
  
  const totalIncome = months.reduce((sum, m) => sum + m.earnings + m.tips, 0)
  const totalExpenses = months.reduce((sum, m) => sum + m.expenses, 0)
  const avgMonthlyIncome = months.length > 0 ? (totalIncome - totalExpenses) / months.length : 0
  const totalTips = months.reduce((sum, m) => sum + m.tips, 0)

  return {
    bestMonth: {
      name: getMonthName(bestMonth.month),
      earnings: bestMonth.earnings + bestMonth.tips
    },
    mostHours: {
      name: getMonthName(mostHours.month),
      hours: mostHours.hours
    },
    avgMonthlyIncome,
    totalTips
  }
})

// Fetch analytics data
const fetchAnalytics = async () => {
  loading.value = true
  try {
    const response = await api.get('/dashboard/yearly', {
      params: { year: selectedYear.value }
    })
    
    if (response.data.success) {
      yearlyData.value = response.data.monthlyData || []
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    toast.error('Failed to load analytics data')
  } finally {
    loading.value = false
  }
}

// Calculate stats when period changes
const calculateStats = () => {
  // Stats are computed automatically
}

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0)
}

const formatChange = (change) => {
  if (change === 0) return '0%'
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

const getChangeClass = (change) => {
  if (change > 0) return 'positive'
  if (change < 0) return 'negative'
  return 'neutral'
}

const getMonthName = (month) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[month - 1] || ''
}

const getBarHeight = (value, max) => {
  if (!value || value === 0) return '0px'
  if (max === 0) return '0px'
  
  // Calculate percentage relative to max value
  const percentage = (value / max) * 100
  
  // If value is very small compared to max, give it minimum 8% visibility
  // Otherwise use the actual percentage (max 95% to leave room at top)
  const finalPercentage = percentage < 5 ? Math.max(percentage, 8) : Math.min(percentage, 95)
  
  return `${finalPercentage}%`
}

// Watch for year changes
watch(selectedYear, () => {
  fetchAnalytics()
})

// Debug log when data changes
watch(yearlyData, (newData) => {
  console.log('Yearly Data:', newData)
  console.log('Displayed Months:', displayedMonths.value)
  console.log('Max Earnings:', maxEarnings.value)
  console.log('Max Hours:', maxHours.value)
}, { deep: true })

onMounted(() => {
  fetchAnalytics()
})
</script>

<style lang="scss" scoped>
.analytics-page {
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

  .header-actions {
    display: flex;
    gap: var(--spacing-md);
    align-items: center;
    
    .year-select {
      padding: 0.625rem 1rem;
      border: 2px solid var(--bg-secondary);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
      color: var(--text-primary);
      font-weight: 600;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: var(--primary);
      }
      
      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }
    }
    
    .period-tabs {
      display: flex;
      gap: var(--spacing-xs);
      background: var(--bg-secondary);
      padding: 4px;
      border-radius: var(--radius-md);
      
      .period-tab {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: 0.5rem 1rem;
        border: none;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--text-secondary);
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        
        i {
          font-size: 1rem;
        }
        
        &:hover {
          color: var(--text-primary);
          background: rgba(99, 102, 241, 0.1);
        }
        
        &.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }
      }
    }
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxl);
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid var(--bg-secondary);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: var(--spacing-md);
  }
  
  p {
    color: var(--text-secondary);
    font-size: 1.125rem;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  
  .stat-card {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    box-shadow: var(--shadow-sm);
    
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
    }
    
    .stat-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      
      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
      
      .stat-value {
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--text-primary);
      }
      
      .stat-change {
        font-size: 0.75rem;
        font-weight: 600;
        
        &.positive {
          color: var(--success);
        }
        
        &.negative {
          color: var(--danger);
        }
        
        &.neutral {
          color: var(--text-secondary);
        }
      }
    }
  }
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  
  .chart-card {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    box-shadow: var(--shadow-sm);
    
    h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: var(--spacing-lg);
    }
    
    .chart-container {
      .empty-chart {
        height: 300px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        
        i {
          font-size: 3rem;
          color: var(--text-secondary);
          opacity: 0.3;
          margin-bottom: var(--spacing-md);
        }
        
        p {
          color: var(--text-secondary);
          font-size: 0.9375rem;
        }
      }
      
      .bar-chart {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: var(--spacing-xs);
        height: 300px;
        padding: var(--spacing-md) 0;
        border-bottom: 2px solid var(--bg-secondary);
        
        .bar-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
          min-width: 0;
          
          .bars-container {
            flex: 1;
            width: 100%;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            
            .bars {
              display: flex;
              gap: 4px;
              align-items: flex-end;
              height: 100%;
              
              .bar {
                position: relative;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding-top: 4px;
                border-radius: 4px 4px 0 0;
                transition: all 0.3s ease;
                cursor: pointer;
                min-height: 8px;
                
                .bar-value {
                  font-size: 0.625rem;
                  font-weight: 700;
                  color: white;
                  white-space: nowrap;
                  opacity: 0;
                  transition: opacity 0.2s ease;
                }
                
                &.earnings {
                  background: linear-gradient(180deg, var(--primary) 0%, var(--primary-light) 100%);
                  width: 32px;
                }
                
                &.tips {
                  background: linear-gradient(180deg, #10b981 0%, #34d399 100%);
                  width: 32px;
                }
                
                &.hours {
                  background: linear-gradient(180deg, #8b5cf6 0%, #a78bfa 100%);
                  width: 40px;
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
          
          .bar-label {
            font-size: 0.75rem;
            color: var(--text-secondary);
            font-weight: 600;
            text-align: center;
            white-space: nowrap;
          }
        }
      }
      
      .chart-legend {
        display: flex;
        gap: var(--spacing-lg);
        justify-content: center;
        margin-top: var(--spacing-md);
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 0.875rem;
          color: var(--text-secondary);
          
          .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            
            &.earnings {
              background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
            }
            
            &.tips {
              background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
            }
          }
        }
      }
    }
  }
}

.insights-section {
  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: var(--spacing-lg);
  }
  
  .insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-lg);
    
    .insight-card {
      background: var(--bg-primary);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      display: flex;
      gap: var(--spacing-md);
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }
      
      i {
        font-size: 2rem;
        color: var(--primary);
      }
      
      .insight-content {
        h4 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--spacing-xs);
        }
        
        p {
          color: var(--text-secondary);
          font-size: 0.875rem;
          line-height: 1.5;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    .header-content h1 {
      font-size: 1.5rem;
    }
    
    .header-actions {
      width: 100%;
      flex-direction: column;
      
      .year-select {
        width: 100%;
      }
      
      .period-tabs {
        width: 100%;
        justify-content: space-between;
        
        .period-tab {
          flex: 1;
          justify-content: center;
          padding: 0.625rem 0.5rem;
          
          span {
            display: none;
          }
          
          i {
            font-size: 1.25rem;
          }
        }
      }
    }
  }
  
  .charts-section {
    grid-template-columns: 1fr;
    
    .chart-card .chart-container .bar-chart {
      height: 250px;
      gap: 2px;
      
      .bar-group {
        .bars-container .bars {
          gap: 2px;
          
          .bar {
            &.earnings, &.tips {
              width: 20px !important;
            }
            
            &.hours {
              width: 25px !important;
            }
          }
        }
        
        .bar-label {
          font-size: 0.625rem;
        }
      }
    }
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
