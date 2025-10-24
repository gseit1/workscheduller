# MongoDB Backend Architecture

## Overview
This document describes the MongoDB-based backend architecture with Models, Controllers, and Routes following MVC pattern.

## Architecture Components

### 1. Models (Data Layer)
Location: `backend/models/`

#### User Model (`User.js`)
- **Collection**: `users`
- **Indexes**: 
  - `email` (unique)
  - `username` (unique)
- **Methods**:
  - `create(userData)` - Create new user
  - `findByEmail(email)` - Find user by email
  - `findByUsername(username)` - Find user by username
  - `findById(id)` - Find user by ID
  - `updateHourlyRate(userId, hourlyRate)` - Update hourly rate
  - `update(userId, updateData)` - Update user profile

#### WorkDay Model (`WorkDay.js`)
- **Collection**: `work_days`
- **Indexes**: 
  - `userId` + `workDate` (descending, compound)
  - `userId` + `workDate` (unique, for preventing duplicates)
- **Methods**:
  - `create(workDayData)` - Add work day entry
  - `findByUser(userId, filters)` - Get work days with pagination and filters
  - `findById(id)` - Get single work day
  - `update(id, userId, updateData)` - Update work day
  - `delete(id, userId)` - Delete work day
  - `getMonthlyStats(userId, month, year)` - Calculate monthly statistics

#### Expense Model (`Expense.js`)
- **Collection**: `expenses`
- **Indexes**: 
  - `userId` + `expenseDate` (descending)
  - `userId` + `type`
  - `userId` + `category`
- **Methods**:
  - `create(expenseData)` - Add expense/income
  - `findByUser(userId, filters)` - Get expenses with filters
  - `findById(id)` - Get single expense
  - `update(id, userId, updateData)` - Update expense
  - `delete(id, userId)` - Delete expense
  - `getMonthlySummary(userId, filters)` - Get income/expense totals
  - `getCategorySummary(userId, filters)` - Get category breakdown

#### CalendarEvent Model (`CalendarEvent.js`)
- **Collection**: `calendar_events`
- **Indexes**: 
  - `userId` + `startDate` (descending)
  - `userId` + `eventType`
- **Methods**:
  - `create(eventData)` - Create calendar event
  - `findByUser(userId, filters)` - Get events by date range
  - `findById(id)` - Get single event
  - `update(id, userId, updateData)` - Update event
  - `delete(id, userId)` - Delete event

#### Goal Model (`Goal.js`)
- **Collection**: `goals`
- **Indexes**: 
  - `userId` + `deadline` (descending)
  - `userId` + `status`
- **Methods**:
  - `create(goalData)` - Create goal
  - `findByUser(userId, filters)` - Get user goals
  - `findById(id)` - Get single goal
  - `update(id, userId, updateData)` - Update goal
  - `updateProgress(id, userId, amount)` - Update goal progress
  - `delete(id, userId)` - Delete goal

### 2. Controllers (Business Logic Layer)
Location: `backend/controllers/`

#### AuthController (`AuthController.js`)
- `register(req, res)` - User registration with password hashing
- `login(req, res)` - User authentication with JWT
- `getProfile(req, res)` - Get user profile
- `updateProfile(req, res)` - Update user settings

#### WorkController (`WorkController.js`)
- `getWorkDays(req, res)` - List work days with pagination
- `createWorkDay(req, res)` - Add new work day
- `updateWorkDay(req, res)` - Update work day details
- `deleteWorkDay(req, res)` - Remove work day
- `getMonthlyStats(req, res)` - Get monthly work statistics

#### ExpenseController (`ExpenseController.js`)
- `getExpenses(req, res)` - List expenses with filters
- `createExpense(req, res)` - Add expense/income
- `updateExpense(req, res)` - Update expense
- `deleteExpense(req, res)` - Delete expense
- `getSummary(req, res)` - Get income/expense summary
- `getCategorySummary(req, res)` - Get category breakdown

#### CalendarController (`CalendarController.js`)
- `getEvents(req, res)` - Get calendar events
- `createEvent(req, res)` - Create calendar event
- `updateEvent(req, res)` - Update event
- `deleteEvent(req, res)` - Delete event

#### DashboardController (`DashboardController.js`)
- `getOverview(req, res)` - Get dashboard overview (stats + recent activity)
- `getYearlyStats(req, res)` - Get yearly statistics for charts

#### GoalController (`GoalController.js`)
- `getGoals(req, res)` - List user goals
- `createGoal(req, res)` - Create new goal
- `updateGoal(req, res)` - Update goal
- `updateProgress(req, res)` - Update goal progress
- `deleteGoal(req, res)` - Delete goal

### 3. Routes (API Endpoints)
Location: `backend/routes/*-new.js`

#### Auth Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /profile` - Get user profile (authenticated)
- `PUT /profile` - Update user profile (authenticated)

#### Work Routes (`/api/work`)
- `GET /days` - Get work days (query: month, year, limit, skip)
- `POST /days` - Create work day
- `PUT /days/:id` - Update work day
- `DELETE /days/:id` - Delete work day
- `GET /stats` - Get monthly stats (query: month, year)

#### Expense Routes (`/api/expenses`)
- `GET /` - Get expenses (query: type, category, month, year)
- `POST /` - Create expense
- `PUT /:id` - Update expense
- `DELETE /:id` - Delete expense
- `GET /summary` - Get summary (query: month, year)
- `GET /categories` - Get category breakdown (query: year)

#### Calendar Routes (`/api/calendar`)
- `GET /events` - Get events (query: month, year, start_date, end_date, date)
- `POST /events` - Create event
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event
- `POST /schedule` - Schedule work day (alias)
- `DELETE /schedule/:id` - Unschedule work day (alias)

#### Dashboard Routes (`/api/dashboard`)
- `GET /overview` - Get dashboard overview
- `GET /yearly` - Get yearly stats (query: year)

#### Goal Routes (`/api/goals`)
- `GET /` - Get goals (query: status, category)
- `POST /` - Create goal
- `PUT /:id` - Update goal
- `POST /:id/progress` - Update progress
- `DELETE /:id` - Delete goal

## Database Schema

### users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String (unique),
  password: String (hashed),
  hourlyRate: Number,
  currency: String,
  createdAt: Date,
  updatedAt: Date
}
```

### work_days Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  workDate: Date,
  hoursWorked: Number,
  hourlyRate: Number,
  tipsAmount: Number,
  notes: String,
  paymentStatus: String, // 'pending', 'paid'
  paymentDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### expenses Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  type: String, // 'income', 'expense'
  category: String,
  description: String,
  amount: Number,
  expenseDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### calendar_events Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  description: String,
  eventType: String, // 'work', 'meeting', 'personal'
  startDate: Date,
  endDate: Date,
  startTime: String,
  endTime: String,
  isAllDay: Boolean,
  priority: String, // 'low', 'normal', 'high'
  status: String, // 'scheduled', 'completed', 'cancelled'
  reminderMinutes: Number,
  location: String,
  attendees: Array,
  color: String,
  course: String,
  createdAt: Date,
  updatedAt: Date
}
```

### goals Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  description: String,
  targetAmount: Number,
  currentAmount: Number,
  deadline: Date,
  status: String, // 'active', 'completed', 'cancelled'
  category: String,
  isShared: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Initialization Flow

1. **Server Startup** (`server.js`)
   - Load environment variables
   - Connect to MongoDB Atlas
   - Initialize all models with database connection
   - Create database indexes
   - Initialize all controllers with models
   - Attach controllers to `app.locals` for route access
   - Register routes
   - Start Express server

2. **Request Flow**
   - Client sends HTTP request
   - Express middleware (CORS, auth, body parser)
   - Route handler receives request
   - Route calls appropriate controller method
   - Controller calls model methods
   - Model interacts with MongoDB
   - Response sent back through the chain

## Authentication

- **Method**: JWT (JSON Web Tokens)
- **Storage**: Local storage (frontend)
- **Header**: `Authorization: Bearer <token>`
- **Expiry**: 7 days
- **Middleware**: `authenticateToken` in `auth-new.js`

## Migration from MySQL

The backend now uses MongoDB instead of MySQL:

✅ **Completed**:
- MongoDB connection handler
- All 5 models created
- All 6 controllers created
- All route files created
- Server.js updated to use new routes
- Indexes created for performance

⚠️ **Old MySQL routes** are commented out for backward compatibility but will be removed.

## Testing

1. **Test MongoDB Connection**:
   ```bash
   cd backend
   npm run test:mongo
   ```

2. **Start Server**:
   ```bash
   npm run dev
   ```

3. **Health Check**:
   ```
   GET http://localhost:3001/api/health
   ```

4. **Test Registration**:
   ```
   POST http://localhost:3001/api/auth/register
   Body: { username, email, password, hourlyRate }
   ```

## Production Deployment

See `DEPLOYMENT_GUIDE.md` for complete deployment instructions to:
- Backend: Render
- Frontend: Netlify
- Database: MongoDB Atlas

## Environment Variables

Required in `.env` and `.env.production`:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/job_analytics

# JWT
JWT_SECRET=your-secret-key

# Server
PORT=3001
NODE_ENV=production

# CORS
CORS_ORIGIN=https://your-frontend-url.netlify.app
```

## Performance Optimizations

- **Indexes**: All frequently queried fields have indexes
- **Pagination**: Work days and expenses support pagination
- **Aggregation**: Dashboard uses MongoDB aggregation pipelines
- **Connection Pooling**: MongoDB driver handles connection pooling
- **Compression**: Response compression enabled
- **Rate Limiting**: 100 requests per 15 minutes in production

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT authentication with expiry
- CORS configuration for production
- Helmet.js security headers
- Input validation
- User-scoped queries (users can only access their own data)
- Rate limiting in production
