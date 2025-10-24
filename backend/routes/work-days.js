const express = require('express');
const { body, validationResult } = require('express-validator');
const authRouter = require('./auth');
const authenticateToken = authRouter.authenticateToken;
const db = require('../config/database');

const router = express.Router();

// Get work days with pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page, limit = 100, month, year } = req.query;

    let whereClause = 'WHERE user_id = ?';
    let params = [req.user.userId];

    if (month && year) {
      whereClause += ' AND MONTH(work_date) = ? AND YEAR(work_date) = ?';
      params.push(month, year);
    }

    // If no pagination requested, return all data
    if (!page) {
      const workDays = await db.query(
        `SELECT * FROM work_days ${whereClause} ORDER BY work_date DESC`,
        params
      );
      return res.json(workDays);
    }

    // Paginated response
    const offset = (page - 1) * limit;
    const workDays = await db.query(
      `SELECT * FROM work_days ${whereClause} ORDER BY work_date DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const total = await db.query(
      `SELECT COUNT(*) as count FROM work_days ${whereClause}`,
      params
    );

    res.json({
      data: workDays,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].count,
        totalPages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get work days error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add work day
router.post('/', authenticateToken, [
  body('work_date').isDate().withMessage('Work date is required'),
  body('hours_worked').isFloat({ min: 0, max: 24 }).withMessage('Hours worked must be between 0 and 24'),
  body('hourly_rate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be positive'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { work_date, hours_worked, hourly_rate, notes, work_type } = req.body;

    // Check if work day already exists for this date
    const existingWorkDay = await db.query(
      'SELECT id FROM work_days WHERE user_id = ? AND work_date = ?',
      [req.user.userId, work_date]
    );

    if (existingWorkDay.length > 0) {
      return res.status(400).json({ message: 'Work day already exists for this date' });
    }

    const result = await db.query(
      'INSERT INTO work_days (user_id, work_date, hours_worked, hourly_rate, notes, work_type) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.userId, work_date, hours_worked, hourly_rate || 15, notes, work_type || 'regular']
    );

    const newWorkDay = await db.query(
      'SELECT * FROM work_days WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newWorkDay[0]);
  } catch (error) {
    console.error('Add work day error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update work day
router.put('/:id', authenticateToken, [
  body('work_date').optional().isDate().withMessage('Work date must be valid'),
  body('hours_worked').optional().isFloat({ min: 0, max: 24 }).withMessage('Hours worked must be between 0 and 24'),
  body('hourly_rate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be positive'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { work_date, hours_worked, hourly_rate, notes, work_type, completed } = req.body;

    // Check if work day exists and belongs to user
    const existingWorkDay = await db.query(
      'SELECT * FROM work_days WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (existingWorkDay.length === 0) {
      return res.status(404).json({ message: 'Work day not found' });
    }

    // Check if updating to a date that already has a work day
    if (work_date && work_date !== existingWorkDay[0].work_date) {
      const duplicateCheck = await db.query(
        'SELECT id FROM work_days WHERE user_id = ? AND work_date = ? AND id != ?',
        [req.user.userId, work_date, id]
      );

      if (duplicateCheck.length > 0) {
        return res.status(400).json({ message: 'Work day already exists for this date' });
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (work_date !== undefined) {
      updateFields.push('work_date = ?');
      updateValues.push(work_date);
    }
    if (hours_worked !== undefined) {
      updateFields.push('hours_worked = ?');
      updateValues.push(hours_worked);
    }
    if (hourly_rate !== undefined) {
      updateFields.push('hourly_rate = ?');
      updateValues.push(hourly_rate);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }
    if (work_type !== undefined) {
      updateFields.push('work_type = ?');
      updateValues.push(work_type);
    }
    if (completed !== undefined) {
      updateFields.push('completed = ?');
      updateValues.push(completed);
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id, req.user.userId);

    await db.query(
      `UPDATE work_days SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      updateValues
    );

    const updatedWorkDay = await db.query(
      'SELECT * FROM work_days WHERE id = ?',
      [id]
    );

    res.json(updatedWorkDay[0]);
  } catch (error) {
    console.error('Update work day error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete work day
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if work day exists and belongs to user
    const existingWorkDay = await db.query(
      'SELECT * FROM work_days WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (existingWorkDay.length === 0) {
      return res.status(404).json({ message: 'Work day not found' });
    }

    await db.query(
      'DELETE FROM work_days WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    res.json({ message: 'Work day deleted successfully' });
  } catch (error) {
    console.error('Delete work day error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Bulk create work days
router.post('/bulk', authenticateToken, [
  body('workDays').isArray({ min: 1 }).withMessage('Work days array is required'),
  body('workDays.*.work_date').isDate().withMessage('Work date is required for each work day'),
  body('workDays.*.hours_worked').isFloat({ min: 0, max: 24 }).withMessage('Hours worked must be between 0 and 24')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { workDays } = req.body;

    // Check for existing work days
    const dates = workDays.map(wd => wd.work_date);
    const existingWorkDays = await db.query(
      `SELECT work_date FROM work_days WHERE user_id = ? AND work_date IN (${dates.map(() => '?').join(',')})`,
      [req.user.userId, ...dates]
    );

    const existingDates = existingWorkDays.map(wd => wd.work_date);
    const newWorkDays = workDays.filter(wd => !existingDates.includes(wd.work_date));

    if (newWorkDays.length === 0) {
      return res.status(400).json({ message: 'All work days already exist' });
    }

    // Insert new work days
    const insertPromises = newWorkDays.map(workDay => {
      return db.query(
        'INSERT INTO work_days (user_id, work_date, hours_worked, hourly_rate, notes, work_type) VALUES (?, ?, ?, ?, ?, ?)',
        [
          req.user.userId,
          workDay.work_date,
          workDay.hours_worked,
          workDay.hourly_rate || 15,
          workDay.notes || '',
          workDay.work_type || 'regular'
        ]
      );
    });

    await Promise.all(insertPromises);

    res.status(201).json({ 
      message: `${newWorkDays.length} work days created successfully`,
      created: newWorkDays.length,
      skipped: workDays.length - newWorkDays.length
    });
  } catch (error) {
    console.error('Bulk create work days error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
