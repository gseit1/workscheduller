const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Register user (for initial setup)
router.post('/register', [
  body('username').isLength({ min: 3 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('hourlyRate').isFloat({ min: 0 }).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, hourlyRate = 15.00 } = req.body;

    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM user WHERE email = ? OR username = ?', [email, username]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await db.query(
      'INSERT INTO user (username, email, password_hash, hourly_rate) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, hourlyRate]
    );

    const userId = result.insertId;

    // Create default work schedule (Monday to Friday)
    const schedulePromises = [];
    for (let day = 1; day <= 5; day++) { // Monday to Friday
      schedulePromises.push(
        db.query(
          'INSERT INTO work_schedule (user_id, day_of_week, is_work_day, default_hours) VALUES (?, ?, true, 8.0)',
          [userId, day]
        )
      );
    }
    // Weekend as non-work days
    schedulePromises.push(
      db.query(
        'INSERT INTO work_schedule (user_id, day_of_week, is_work_day, default_hours) VALUES (?, ?, false, 0.0)',
        [userId, 0] // Sunday
      )
    );
    schedulePromises.push(
      db.query(
        'INSERT INTO work_schedule (user_id, day_of_week, is_work_day, default_hours) VALUES (?, ?, false, 0.0)',
        [userId, 6] // Saturday
      )
    );

    await Promise.all(schedulePromises);

    // Generate JWT
    const token = jwt.sign({ userId, username }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: userId, username, email, hourlyRate }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const users = await db.query('SELECT * FROM user WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        hourlyRate: user.hourly_rate
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const users = await db.query('SELECT id, username, email, hourly_rate, created_at FROM user WHERE id = ?', [req.user.userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update hourly rate (supports optional effectiveFrom date for applying prospectively)
router.put('/hourly-rate', authenticateToken, [
  body('hourlyRate').isFloat({ min: 0 }),
  body('effectiveFrom').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { hourlyRate, effectiveFrom } = req.body;
    // Always keep latest rate on user table for convenience
    await db.query('UPDATE user SET hourly_rate = ? WHERE id = ?', [hourlyRate, req.user.userId]);

    // Also record into user_hourly_rates history if effectiveFrom provided
    if (effectiveFrom) {
      await db.query(
        `INSERT INTO user_hourly_rates (user_id, hourly_rate, effective_from)
         VALUES (?, ?, ?)`,
        [req.user.userId, hourlyRate, effectiveFrom]
      );
    }

    res.json({ message: 'Hourly rate updated successfully', hourlyRate, effectiveFrom: effectiveFrom || null });
  } catch (error) {
    console.error('Hourly rate update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
