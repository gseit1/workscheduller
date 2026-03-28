const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongodb = require('./config/mongodb');
require('dotenv').config();

// Import Models
const UserModel = require('./models/User');
const WorkDayModel = require('./models/WorkDay');
const ExpenseModel = require('./models/Expense');
const CalendarEventModel = require('./models/CalendarEvent');
const GoalModel = require('./models/Goal');

// Import Controllers
const AuthController = require('./controllers/AuthController');
const WorkController = require('./controllers/WorkController');
const ExpenseController = require('./controllers/ExpenseController');
const CalendarController = require('./controllers/CalendarController');
const DashboardController = require('./controllers/DashboardController');
const GoalController = require('./controllers/GoalController');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize models and controllers
let models = {};
let controllers = {};

// Connect to MongoDB and initialize models
async function startServer() {
  try {
    await mongodb.connect();
    console.log('✅ MongoDB connected successfully');
    
    const db = mongodb.getDb();
    
    // Initialize models
    models.user = new UserModel(db);
    models.workDay = new WorkDayModel(db);
    models.expense = new ExpenseModel(db);
    models.calendarEvent = new CalendarEventModel(db);
    models.goal = new GoalModel(db);
    
    // Create indexes
    await Promise.all([
      models.user.createIndexes(),
      models.workDay.createIndexes(),
      models.expense.createIndexes(),
      models.calendarEvent.createIndexes(),
      models.goal.createIndexes()
    ]);
    console.log('✅ Database indexes created');
    
    // Initialize controllers
    controllers.auth = new AuthController(models.user);
    controllers.work = new WorkController(models.workDay);
    controllers.expense = new ExpenseController(models.expense);
    controllers.calendar = new CalendarController(models.calendarEvent);
    controllers.dashboard = new DashboardController(models.workDay, models.expense, models.goal);
    controllers.goal = new GoalController(models.goal);
    
    // Make controllers available to routes
    app.locals.controllers = controllers;
    
    console.log('✅ Models and controllers initialized');
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    process.exit(1);
  }
}

startServer();

// Production security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production' ? true : false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  }
}));

// Compression for better performance
app.use(compression());

// Rate limiting for production
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes default
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
}

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // In production, allow CORS_ORIGIN from environment (comma-separated list)
    // In development, allow localhost
    const envOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : [];
    
    const allowedOrigins = [
      ...envOrigins,
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:3000',
      'http://localhost:5173', // Vite dev server
      'https://hustlerio.netlify.app' // Explicitly allow deployed frontend
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed) || origin === allowed) ||
                      origin.endsWith('.netlify.app') || 
                      origin.endsWith('.vercel.app');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight for 10 minutes
};

app.use(cors(corsOptions));
// Increase payload limit to allow base64 encoded images (up to 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// New MongoDB-based routes (with controllers)
app.use('/api/auth', require('./routes/auth-new'));
app.use('/api/work', require('./routes/work-new'));
app.use('/api/expenses', require('./routes/expenses-new'));
app.use('/api/dashboard', require('./routes/dashboard-new'));
app.use('/api/calendar', require('./routes/calendar-new'));
app.use('/api/goals', require('./routes/goals-new'));

// Legacy MySQL routes (for backward compatibility - will be deprecated)
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/work', require('./routes/work'));
// app.use('/api/work-days', require('./routes/work-days'));
// app.use('/api/expenses', require('./routes/expenses'));
// app.use('/api/dashboard', require('./routes/dashboard'));
// app.use('/api/calendar', require('./routes/calendar'));

// Health check with more detailed information
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    database: 'MongoDB'
  });
});

// Production error handling middleware
app.use((err, req, res, next) => {
  // Log error details (you might want to use a proper logging service in production)
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Don't expose sensitive error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong!' 
    : err.message;

  res.status(err.status || 500).json({ 
    message,
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack
    } : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:8080'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});
