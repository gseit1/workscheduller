<template>
  <div class="calendar-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Calendar</h1>
        <p>View your work schedule and planned days</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="openScheduleModal">
          <i class="bi bi-plus-circle"></i>
          <span>Schedule Day</span>
        </button>
        <button class="btn btn-secondary" @click="goToToday">
          <i class="bi bi-calendar-today"></i>
          <span>Today</span>
        </button>
      </div>
    </div>

    <div class="calendar-controls">
      <button @click="previousMonth" class="btn btn-icon">
        <i class="bi bi-chevron-left"></i>
      </button>
      <h2>{{ currentMonthYear }}</h2>
      <button @click="nextMonth" class="btn btn-icon">
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>

    <div class="calendar-summary">
      <div class="summary-chip">
        <span class="chip-label">Worked Days</span>
        <strong>{{ monthSummary.workedDays }}</strong>
      </div>
      <div class="summary-chip">
        <span class="chip-label">Scheduled</span>
        <strong>{{ monthSummary.scheduledDays }}</strong>
      </div>
      <div class="summary-chip earnings">
        <span class="chip-label">Month Earnings</span>
        <strong>€{{ monthSummary.earnings }}</strong>
      </div>
    </div>

    <div class="calendar-grid-scroll">
      <div class="calendar-grid">
      <div class="calendar-header">
        <div class="day-label" v-for="day in daysOfWeek" :key="day">{{ day }}</div>
      </div>
      <div class="calendar-body">
        <div 
          v-for="day in calendarDays" 
          :key="day.date"
          :class="['calendar-day', {
            'today': day.isToday,
            'other-month': !day.isCurrentMonth,
            'has-work': day.hasWork,
            'scheduled': day.isScheduled
          }]"
        >
          <div class="day-content">
            <div class="day-number">{{ day.day }}</div>
            <div v-if="day.hasWork" class="day-details">
              <div class="earnings">€{{ day.totalEarnings }}</div>
              <div class="day-actions">
                <button @click.stop="editWorkDay(day)" class="btn-icon-sm" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button @click.stop="deleteWorkDay(day)" class="btn-icon-sm" title="Delete">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
            <div v-else-if="day.isScheduled" class="day-details">
              <div class="day-actions">
                <button @click.stop="editScheduledDay(day)" class="btn-icon-sm" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button @click.stop="deleteScheduledDay(day)" class="btn-icon-sm" title="Delete">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>

    <div class="calendar-legend">
      <div class="legend-item">
        <span class="legend-dot scheduled"></span>
        <span>Scheduled</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot has-work"></span>
        <span>Worked</span>
      </div>
    </div>

    <!-- Schedule Day Modal -->
    <div v-if="showScheduleModal" class="modal-overlay" @click="closeScheduleModal">
      <div class="modal-content schedule-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingSchedule ? 'Edit Scheduled Day' : 'Schedule Work Day' }}</h3>
          <button class="btn-close" @click="closeScheduleModal">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div class="modal-body schedule-modal-body">
          <div class="form-group">
            <label>Date</label>
            <input 
              ref="scheduleDateInput"
              v-model="scheduleForm.date" 
              type="date" 
              class="form-control"
              required
            />
          </div>
          <div class="schedule-calendar-element" aria-label="Calendar quick selector">
            <div class="calendar-element-header">
              <i class="bi bi-calendar3"></i>
              <span>{{ scheduleForm.date ? formatScheduleDate(scheduleForm.date) : 'Choose a date for this schedule' }}</span>
            </div>
            <div class="calendar-quick-actions">
              <button type="button" class="calendar-chip" @click="setScheduleDateOffset(0)">Today</button>
              <button type="button" class="calendar-chip" @click="setScheduleDateOffset(1)">Tomorrow</button>
              <button type="button" class="calendar-chip" @click="setScheduleDateOffset(7)">+ 7 Days</button>
              <button type="button" class="calendar-chip primary" @click="openScheduleDatePicker">Open Calendar</button>
            </div>
          </div>
          <div class="form-group">
            <label>Title (Optional)</label>
            <input 
              v-model="scheduleForm.title" 
              type="text" 
              class="form-control"
              placeholder="e.g., Morning Shift"
            />
          </div>
          <div class="form-group">
            <label>Notes (Optional)</label>
            <textarea 
              v-model="scheduleForm.notes" 
              class="form-control"
              rows="3"
              placeholder="Any additional details..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer schedule-modal-footer">
          <button class="btn btn-secondary" @click="closeScheduleModal">Cancel</button>
          <button class="btn btn-primary" @click="saveScheduledDay" :disabled="!scheduleForm.date">
            {{ editingSchedule ? 'Update' : 'Schedule' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Work Day Modal -->
    <div v-if="showEditWorkModal" class="modal-overlay" @click="closeEditWorkModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Edit Work Day</h3>
          <button class="btn-close" @click="closeEditWorkModal">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Date</label>
            <input 
              v-model="workForm.workDate" 
              type="date" 
              class="form-control"
              required
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Hours Worked</label>
              <input 
                v-model.number="workForm.hoursWorked" 
                type="number" 
                step="0.5"
                min="0"
                class="form-control"
                required
              />
            </div>
            <div class="form-group">
              <label>Hourly Rate (€)</label>
              <input 
                v-model.number="workForm.hourlyRate" 
                type="number" 
                step="0.5"
                min="0"
                class="form-control"
                required
              />
            </div>
          </div>
          <div class="form-group">
            <label>Tips (€)</label>
            <input 
              v-model.number="workForm.tipsAmount" 
              type="number" 
              step="0.5"
              min="0"
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label>Notes (Optional)</label>
            <textarea 
              v-model="workForm.notes" 
              class="form-control"
              rows="3"
            ></textarea>
          </div>
          <div class="earnings-preview" v-if="workForm.hoursWorked && workForm.hourlyRate">
            <div class="preview-label">Earnings Preview:</div>
            <div class="preview-value">
              €{{ (workForm.hoursWorked * workForm.hourlyRate).toFixed(2) }}
              <span v-if="workForm.tipsAmount"> + €{{ workForm.tipsAmount }} tips</span>
              = €{{ ((workForm.hoursWorked * workForm.hourlyRate) + (workForm.tipsAmount || 0)).toFixed(2) }}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeEditWorkModal">Cancel</button>
          <button class="btn btn-primary" @click="saveWorkDay" :disabled="!workForm.workDate || !workForm.hoursWorked || !workForm.hourlyRate">
            Update
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, addDays, parseISO } from 'date-fns'
import api from '../services/api'
import { useToast } from 'vue-toastification'

const toast = useToast()
const currentDate = ref(new Date())
const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] // Sunday moved to end
const scheduledDays = ref([])
const workDays = ref([])
const workDaysData = ref([]) // Store full work day data
const scheduledDaysData = ref([]) // Store full scheduled day data
const loading = ref(false)

// Schedule modal state
const showScheduleModal = ref(false)
const editingSchedule = ref(false)
const scheduleDateInput = ref(null)
const scheduleForm = ref({
  id: null,
  date: '',
  title: '',
  notes: ''
})

// Work edit modal state
const showEditWorkModal = ref(false)
const workForm = ref({
  id: null,
  workDate: '',
  hoursWorked: 0,
  hourlyRate: 0,
  tipsAmount: 0,
  notes: ''
})

const currentMonthYear = computed(() => {
  return format(currentDate.value, 'MMMM yyyy')
})

const monthSummary = computed(() => {
  const monthDays = calendarDays.value.filter(day => day.isCurrentMonth)
  const workedDays = monthDays.filter(day => day.hasWork).length
  const scheduledDays = monthDays.filter(day => day.isScheduled && !day.hasWork).length
  const earnings = monthDays
    .filter(day => day.hasWork)
    .reduce((total, day) => total + Number(day.totalEarnings), 0)

  return {
    workedDays,
    scheduledDays,
    earnings: earnings.toFixed(2)
  }
})

const formatScheduleDate = (dateStr) => {
  if (!dateStr) return ''

  try {
    return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy')
  } catch {
    return dateStr
  }
}

const setScheduleDateOffset = (daysToAdd) => {
  scheduleForm.value.date = format(addDays(new Date(), daysToAdd), 'yyyy-MM-dd')
}

const openScheduleDatePicker = () => {
  if (!scheduleDateInput.value) return

  if (typeof scheduleDateInput.value.showPicker === 'function') {
    scheduleDateInput.value.showPicker()
    return
  }

  scheduleDateInput.value.focus()
}

const fetchCalendarData = async () => {
  try {
    loading.value = true
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()
    
    // Fetch work days
    const workResponse = await api.get('/work/days', {
      params: { month, year }
    })
    const workData = workResponse.data.workDays || []
    workDaysData.value = workData.filter(day => day.workDate)
    workDays.value = workDaysData.value.map(day => format(new Date(day.workDate), 'yyyy-MM-dd'))
    
    // Fetch scheduled days from calendar events
    const calendarResponse = await api.get('/calendar/events', {
      params: { month, year }
    })
    const eventsData = calendarResponse.data.events || []
    scheduledDaysData.value = eventsData.filter(event => event.startDate)
    scheduledDays.value = scheduledDaysData.value.map(event => format(new Date(event.startDate), 'yyyy-MM-dd'))
    
  } catch (error) {
    console.error('Error fetching calendar data:', error)
    toast.error('Failed to load calendar data')
  } finally {
    loading.value = false
  }
}

const calendarDays = computed(() => {
  const start = startOfMonth(currentDate.value)
  const end = endOfMonth(currentDate.value)
  const days = eachDayOfInterval({ start, end })
  
  // Adjust for Monday start (getDay() returns 0 for Sunday, 1 for Monday, etc.)
  // We want Monday = 0, Tuesday = 1, ..., Sunday = 6
  const startDay = start.getDay()
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1
  
  // Add padding days from previous month
  const previousMonthEnd = new Date(start)
  previousMonthEnd.setDate(0)
  const previousMonthDays = []
  for (let i = adjustedStartDay - 1; i >= 0; i--) {
    const date = new Date(previousMonthEnd)
    date.setDate(previousMonthEnd.getDate() - i)
    previousMonthDays.push(date)
  }
  
  // Add padding days from next month
  const endDay = end.getDay()
  const adjustedEndDay = endDay === 0 ? 6 : endDay - 1
  const nextMonthDays = []
  for (let i = 1; i <= (6 - adjustedEndDay); i++) {
    const date = new Date(end)
    date.setDate(end.getDate() + i)
    nextMonthDays.push(date)
  }
  
  const allDays = [...previousMonthDays, ...days, ...nextMonthDays]
  
  return allDays.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const workDay = workDaysData.value.find(wd => format(new Date(wd.workDate), 'yyyy-MM-dd') === dateStr)
    const scheduledDay = scheduledDaysData.value.find(sd => format(new Date(sd.startDate), 'yyyy-MM-dd') === dateStr)
    
    return {
      date: date.toISOString(),
      day: date.getDate(),
      isToday: isToday(date),
      isCurrentMonth: isSameMonth(date, currentDate.value),
      hasWork: !!workDay,
      isScheduled: !!scheduledDay,
      totalEarnings: workDay ? ((workDay.hoursWorked * workDay.hourlyRate) + (workDay.tipsAmount || 0)).toFixed(2) : 0,
      workDayData: workDay,
      scheduledDayData: scheduledDay
    }
  })
})

const previousMonth = () => {
  currentDate.value = subMonths(currentDate.value, 1)
  fetchCalendarData()
}

const nextMonth = () => {
  currentDate.value = addMonths(currentDate.value, 1)
  fetchCalendarData()
}

const goToToday = () => {
  currentDate.value = new Date()
  fetchCalendarData()
}

// Schedule modal functions
const openScheduleModal = () => {
  editingSchedule.value = false
  scheduleForm.value = {
    id: null,
    date: format(new Date(), 'yyyy-MM-dd'),
    title: '',
    notes: ''
  }
  showScheduleModal.value = true
}

const closeScheduleModal = () => {
  showScheduleModal.value = false
  scheduleForm.value = { id: null, date: '', title: '', notes: '' }
}

const saveScheduledDay = async () => {
  try {
    const eventData = {
      title: scheduleForm.value.title || 'Scheduled Work',
      startDate: scheduleForm.value.date,
      endDate: scheduleForm.value.date,
      allDay: true,
      notes: scheduleForm.value.notes,
      eventType: 'work'
    }

    if (editingSchedule.value && scheduleForm.value.id) {
      await api.put(`/calendar/events/${scheduleForm.value.id}`, eventData)
      toast.success('Scheduled day updated!')
    } else {
      await api.post('/calendar/events', eventData)
      toast.success('Day scheduled successfully!')
    }
    
    closeScheduleModal()
    fetchCalendarData()
  } catch (error) {
    console.error('Error saving scheduled day:', error)
    toast.error('Failed to save scheduled day')
  }
}

const editScheduledDay = (day) => {
  if (!day.scheduledDayData) return
  
  editingSchedule.value = true
  scheduleForm.value = {
    id: day.scheduledDayData._id,
    date: format(new Date(day.scheduledDayData.startDate), 'yyyy-MM-dd'),
    title: day.scheduledDayData.title,
    notes: day.scheduledDayData.notes || ''
  }
  showScheduleModal.value = true
}

const deleteScheduledDay = async (day) => {
  if (!day.scheduledDayData) return
  
  if (!confirm('Are you sure you want to delete this scheduled day?')) return
  
  try {
    await api.delete(`/calendar/events/${day.scheduledDayData._id}`)
    toast.success('Scheduled day deleted!')
    fetchCalendarData()
  } catch (error) {
    console.error('Error deleting scheduled day:', error)
    toast.error('Failed to delete scheduled day')
  }
}

// Work day edit functions
const editWorkDay = (day) => {
  if (!day.workDayData) return
  
  workForm.value = {
    id: day.workDayData._id,
    workDate: format(new Date(day.workDayData.workDate), 'yyyy-MM-dd'),
    hoursWorked: day.workDayData.hoursWorked,
    hourlyRate: day.workDayData.hourlyRate,
    tipsAmount: day.workDayData.tipsAmount || 0,
    notes: day.workDayData.notes || ''
  }
  showEditWorkModal.value = true
}

const closeEditWorkModal = () => {
  showEditWorkModal.value = false
  workForm.value = { id: null, workDate: '', hoursWorked: 0, hourlyRate: 0, tipsAmount: 0, notes: '' }
}

const saveWorkDay = async () => {
  try {
    const workData = {
      workDate: workForm.value.workDate,
      hoursWorked: workForm.value.hoursWorked,
      hourlyRate: workForm.value.hourlyRate,
      tipsAmount: workForm.value.tipsAmount,
      notes: workForm.value.notes
    }

    await api.put(`/work/days/${workForm.value.id}`, workData)
    toast.success('Work day updated!')
    
    closeEditWorkModal()
    fetchCalendarData()
  } catch (error) {
    console.error('Error updating work day:', error)
    toast.error('Failed to update work day')
  }
}

const deleteWorkDay = async (day) => {
  if (!day.workDayData) return
  
  if (!confirm('Are you sure you want to delete this work day?')) return
  
  try {
    await api.delete(`/work/days/${day.workDayData._id}`)
    toast.success('Work day deleted!')
    fetchCalendarData()
  } catch (error) {
    console.error('Error deleting work day:', error)
    toast.error('Failed to delete work day')
  }
}

onMounted(() => {
  fetchCalendarData()
})
</script>

<style lang="scss" scoped>
.calendar-page {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding-inline: clamp(0.75rem, 2.8vw, 1.5rem);
  padding-bottom: calc(var(--spacing-lg) + 5rem + env(safe-area-inset-bottom));
}

.calendar-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);

  .summary-chip {
    background: linear-gradient(145deg, var(--bg-primary), var(--bg-secondary));
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 0.75rem;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .chip-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    strong {
      font-size: 1.15rem;
      color: var(--text-primary);
      line-height: 1;
    }

    &.earnings strong {
      color: var(--success);
    }
  }
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

  .header-actions .btn {
    min-height: 44px;
  }
}

.calendar-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    min-width: 200px;
    text-align: center;
    line-height: 1.2;
  }
}

.calendar-grid-scroll {
  overflow-x: auto;
  overflow-y: visible;
}

.calendar-grid {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  width: 100%;
  min-width: 760px;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  
  .day-label {
    text-align: center;
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 0.875rem;
    padding: var(--spacing-sm);
  }
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--spacing-sm);
}

.calendar-day {
  min-height: 120px;
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  transition: all 0.2s;
  background: var(--bg-secondary);
  position: relative;
  display: flex;
  flex-direction: column;
  
  &:hover {
    background: var(--primary-light);
  }
  
  &.other-month {
    opacity: 0.3;
  }
  
  &.today {
    background: var(--primary);
    color: white;
    
    .day-number, .earnings, .scheduled-label {
      color: white;
    }
  }
  
  &.scheduled {
    border: 2px solid var(--warning);
  }
  
  &.has-work {
    border: 2px solid var(--success);
  }
  
  .day-content {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .day-number {
    font-weight: 700;
    color: var(--text-primary);
    font-size: 1rem;
    margin-bottom: var(--spacing-xs);
  }
  
  .day-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin-top: var(--spacing-xs);
  }
  
  .earnings {
    font-weight: 600;
    color: var(--success);
    font-size: 0.875rem;
    margin-bottom: var(--spacing-xs);
  }
  
  .scheduled-label {
    font-size: 0.75rem;
    color: var(--warning);
    font-weight: 600;
    margin-bottom: var(--spacing-xs);
  }
  
  .day-actions {
    display: flex;
    gap: var(--spacing-xs);
    margin-top: auto;
  }
  
  .btn-icon-sm {
    background: rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: var(--radius-sm);
    padding: 4px 8px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-primary);
    font-size: 0.75rem;
    
    &:hover {
      background: var(--primary);
      color: white;
    }
  }
}

.calendar-legend {
  display: flex;
  gap: var(--spacing-lg);
  justify-content: center;
  margin-top: var(--spacing-lg);
  flex-wrap: wrap;
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 0.875rem;
    color: var(--text-secondary);
    
    .legend-dot {
      width: 16px;
      height: 16px;
      border-radius: var(--radius-sm);
      
      &.scheduled {
        border: 2px solid var(--warning);
      }
      
      &.has-work {
        border: 2px solid var(--success);
      }
    }
  }
}

.calendar-grid-scroll::-webkit-scrollbar {
  height: 8px;
}

.calendar-grid-scroll::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: var(--radius-full);
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
  z-index: 1300;
  padding: var(--spacing-md);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  max-width: 500px;
  width: 100%;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow-y: auto;
  overscroll-behavior: contain;
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
  flex-wrap: wrap;
  justify-content: flex-end;
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.schedule-modal {
  width: min(560px, calc(100vw - 2rem));
}

.schedule-modal-body {
  padding-bottom: max(var(--spacing-lg), env(safe-area-inset-bottom));
}

.schedule-calendar-element {
  margin-top: calc(var(--spacing-xs) * -1);
  margin-bottom: var(--spacing-md);
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
}

.calendar-element-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  font-size: 0.9rem;
  margin-bottom: 0.6rem;

  i {
    color: var(--primary);
  }

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.calendar-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.calendar-chip {
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-primary);
  border-radius: var(--radius-full);
  padding: 0.35rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.2;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  &.primary {
    background: var(--primary);
    border-color: var(--primary);
    color: #fff;

    &:hover {
      filter: brightness(0.95);
      color: #fff;
    }
  }
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.earnings-preview {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--success-light);
  border-radius: var(--radius-md);
  border: 1px solid var(--success);
  
  .preview-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xs);
  }
  
  .preview-value {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--success);
  }
}

@media (max-width: 768px) {
  .calendar-page {
    max-width: 100%;
    padding-inline: 0.75rem;
  }

  .page-header {
    margin-bottom: var(--spacing-lg);

    .header-content h1 {
      font-size: 1.5rem;
    }
    
    .header-actions {
      width: 100%;
      display: flex;
      gap: var(--spacing-sm);
      
      button {
        flex: 1;
      }
    }
  }

  .calendar-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    .summary-chip.earnings {
      grid-column: 1 / -1;
    }
  }
  
  .calendar-controls h2 {
    font-size: 1.25rem;
    min-width: 0;
    flex: 1;
  }
  
  .calendar-grid {
    padding: 0.75rem;
    min-width: 0;
  }

  .calendar-grid-scroll {
    overflow-x: visible;
  }

  .calendar-header,
  .calendar-body {
    gap: 0.35rem;
  }
  
  .calendar-day {
    min-height: clamp(74px, 12vw, 92px);
    padding: 0.3rem;
    
    .day-number {
      font-size: 0.875rem;
    }
    
    .earnings {
      font-size: 0.75rem;
    }
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal-content {
    max-width: 100%;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    height: 70dvh;
    max-height: 70dvh;
  }

  .schedule-modal {
    width: 100%;
  }

  .schedule-modal .modal-header,
  .schedule-modal .modal-body,
  .schedule-modal .modal-footer {
    padding-inline: var(--spacing-lg);
  }

  .schedule-modal .modal-header h3 {
    font-size: 1.1rem;
    line-height: 1.25;
    margin-right: var(--spacing-sm);
  }

  .schedule-modal .form-control {
    font-size: 16px;
  }

  .schedule-calendar-element {
    padding: 0.7rem;
  }

  .calendar-quick-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .calendar-chip {
    width: 100%;
    min-height: 38px;
  }

  .schedule-modal-footer {
    width: 100%;
    flex-direction: column-reverse;
    gap: var(--spacing-sm);
    padding-bottom: calc(var(--spacing-lg) + env(safe-area-inset-bottom));
  }

  .schedule-modal-footer .btn {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .calendar-page {
    padding-inline: 0.625rem;
  }

  .page-header {
    gap: 0.75rem;

    .header-content {
      h1 {
        font-size: 1.3rem;
      }

      p {
        font-size: 0.88rem;
      }
    }

    .header-actions {
      button {
        padding: 0.6rem 0.5rem;
        font-size: 0.86rem;
      }
    }
  }

  .calendar-summary {
    gap: 0.4rem;

    .summary-chip {
      padding: 0.6rem;

      .chip-label {
        font-size: 0.68rem;
      }

      strong {
        font-size: 0.96rem;
      }
    }
  }

  .calendar-controls {
    gap: 0.35rem;
    margin-bottom: 0.75rem;

    .btn-icon {
      width: 34px;
      height: 34px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    h2 {
      font-size: 1.02rem;
      margin: 0;
    }
  }

  .calendar-grid {
    padding: 0.625rem;
    border-radius: var(--radius-md);
    min-width: 0;
  }

  .calendar-grid-scroll {
    overflow-x: visible;
  }

  .calendar-header,
  .calendar-body {
    gap: 0.2rem;
  }

  .calendar-header .day-label {
    font-size: 0.62rem;
    padding: 0.2rem 0.1rem;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  .calendar-day {
    min-height: clamp(58px, 14vw, 72px);
    padding: 0.2rem;
    border-radius: 0.5rem;

    .day-number {
      font-size: 0.74rem;
      margin-bottom: 0.06rem;
      line-height: 1;
    }

    .earnings,
    .scheduled-label {
      font-size: 0.54rem;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .day-details {
      margin-top: 0;
    }

    .day-actions {
      display: none;
    }

    .btn-icon-sm {
      padding: 3px 6px;
      font-size: 0.7rem;
    }
  }

  .calendar-legend {
    margin-top: 0.85rem;
    gap: 0.5rem;

    .legend-item {
      font-size: 0.74rem;
      gap: 0.35rem;
    }
  }
}
</style>
