const express = require('express');
const { body, validationResult } = require('express-validator');
const authRouter = require('./auth');
const authenticateToken = authRouter.authenticateToken;
const db = require('../config/database');

const router = express.Router();

// Get work schedule
router.get('/schedule', authenticateToken, async (req, res) => {
  try {
    const schedule = await db.query(
      'SELECT * FROM work_schedule WHERE user_id = ? ORDER BY day_of_week',
      [req.user.userId]
    );
    res.json(schedule);
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update work schedule
router.put('/schedule', authenticateToken, async (req, res) => {
  try {
    const { schedule } = req.body; // Array of {day_of_week, is_work_day, default_hours}
    
    const updatePromises = schedule.map(day => 
      db.query(
        'UPDATE work_schedule SET is_work_day = ?, default_hours = ? WHERE user_id = ? AND day_of_week = ?',
        [day.is_work_day, day.default_hours, req.user.userId, day.day_of_week]
      )
    );

    await Promise.all(updatePromises);
    res.json({ message: 'Schedule updated successfully' });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get work days with pagination
router.get('/days', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 30, month, year } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE user_id = ?';
    let params = [req.user.userId];

    if (month && year) {
      whereClause += ' AND MONTH(work_date) = ? AND YEAR(work_date) = ?';
      params.push(month, year);
    }

    const workDays = await db.query(
      `SELECT wd.*, u.hourly_rate,
             ROUND(wd.hours_worked * (
               SELECT r.hourly_rate FROM user_hourly_rates r
               WHERE r.user_id = wd.user_id AND r.effective_from <= wd.work_date
               ORDER BY r.effective_from DESC
               LIMIT 1
             ), 2) as calculated_payment,
             ROUND(IFNULL(wd.tips_amount, 0), 2) as tips_amount,
             wd.payment_status,
             wd.payment_date
       FROM work_days wd 
       JOIN user u ON wd.user_id = u.id 
       ${whereClause} 
       ORDER BY work_date DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM work_days ${whereClause}`,
      params
    );

    res.json({
      workDays,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get work days error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add work day
router.post('/days', authenticateToken, [
  body('workDate').isISO8601().toDate(),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('hoursWorked').isFloat({ min: 0, max: 24 }),
  body('tipsAmount').optional().isFloat({ min: 0 }),
  body('notes').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { workDate, startTime, endTime, hoursWorked, tipsAmount = 0, notes = '' } = req.body;

    // Debug logging
    console.log('Received work day data:', {
      workDate,
      startTime,
      endTime,
      hoursWorked,
      tipsAmount,
      notes
    });

    // Convert empty strings and undefined to null for time fields
    const processedStartTime = (!startTime || startTime === '') ? null : startTime;
    const processedEndTime = (!endTime || endTime === '') ? null : endTime;
    const processedTipsAmount = (!tipsAmount || tipsAmount === '' || isNaN(tipsAmount)) ? 0 : parseFloat(tipsAmount);

    console.log('Processed data:', {
      processedStartTime,
      processedEndTime,
      processedTipsAmount
    });

    const result = await db.query(
      'INSERT INTO work_days (user_id, work_date, start_time, end_time, hours_worked, tips_amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.userId, workDate, processedStartTime, processedEndTime, hoursWorked, processedTipsAmount, notes]
    );

    // Get the inserted record with calculated payment
    const insertedDay = await db.query(
      `SELECT wd.*, u.hourly_rate, 
             ROUND(wd.hours_worked * u.hourly_rate, 2) as calculated_payment,
             ROUND(IFNULL(wd.tips_amount, 0), 2) as tips_amount,
             wd.payment_status,
             wd.payment_date
       FROM work_days wd 
       JOIN user u ON wd.user_id = u.id 
       WHERE wd.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Work day added successfully',
      workDay: insertedDay[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Work day for this date already exists' });
    }
    console.error('Add work day error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update work day
router.put('/days/:id', authenticateToken, [
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('hoursWorked').isFloat({ min: 0, max: 24 }),
  body('tipsAmount').optional().isFloat({ min: 0 }),
  body('notes').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { startTime, endTime, hoursWorked, tipsAmount = 0, notes = '' } = req.body;

    // Convert empty strings and undefined to null for time fields
    const processedStartTime = (!startTime || startTime === '') ? null : startTime;
    const processedEndTime = (!endTime || endTime === '') ? null : endTime;
    const processedTipsAmount = (!tipsAmount || tipsAmount === '' || isNaN(tipsAmount)) ? 0 : parseFloat(tipsAmount);

    const result = await db.query(
      'UPDATE work_days SET start_time = ?, end_time = ?, hours_worked = ?, tips_amount = ?, notes = ? WHERE id = ? AND user_id = ?',
      [processedStartTime, processedEndTime, hoursWorked, processedTipsAmount, notes, id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Work day not found' });
    }

    res.json({ message: 'Work day updated successfully' });
  } catch (error) {
    console.error('Update work day error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update payment status
router.patch('/days/:id/payment', authenticateToken, [
  body('paymentStatus').isIn(['pending', 'paid']),
  body('paymentDate').optional().isISO8601().toDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { paymentStatus, paymentDate } = req.body;

    // If marking as paid and no payment date provided, use current date
    const finalPaymentDate = paymentStatus === 'paid' 
      ? (paymentDate || new Date().toISOString().split('T')[0])
      : null;

    const result = await db.query(
      'UPDATE work_days SET payment_status = ?, payment_date = ? WHERE id = ? AND user_id = ?',
      [paymentStatus, finalPaymentDate, id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Work day not found' });
    }

    res.json({ 
      message: `Payment status updated to ${paymentStatus}`,
      paymentStatus,
      paymentDate: finalPaymentDate
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete work day
router.delete('/days/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM work_days WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Work day not found' });
    }

    res.json({ message: 'Work day deleted successfully' });
  } catch (error) {
    console.error('Delete work day error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get monthly statistics
router.get('/stats/monthly', authenticateToken, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const monthlyStats = await db.query(`
      SELECT 
        MONTH(work_date) as month,
        YEAR(work_date) as year,
        COUNT(*) as days_worked,
        SUM(hours_worked) as total_hours,
        AVG(hours_worked) as avg_hours_per_day,
        ROUND(SUM(hours_worked * (
          SELECT r.hourly_rate FROM user_hourly_rates r
          WHERE r.user_id = wd.user_id AND r.effective_from <= wd.work_date
          ORDER BY r.effective_from DESC
          LIMIT 1
        )), 2) as total_earnings,
        ROUND(SUM(IFNULL(tips_amount, 0)), 2) as total_tips
      FROM work_days wd
      WHERE user_id = ? AND YEAR(work_date) = ?
      GROUP BY YEAR(work_date), MONTH(work_date)
      ORDER BY month
    `, [req.user.userId, year]);

    res.json(monthlyStats);
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Bulk schedule operations
router.post('/schedule/bulk', authenticateToken, async (req, res) => {
  try {
    const { dates, hours = 8 } = req.body; // Array of date strings and default hours
    
    const insertPromises = dates.map(date => 
      db.query(`
        INSERT INTO scheduled_work_days (user_id, scheduled_date, planned_hours)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE planned_hours = VALUES(planned_hours)
      `, [req.user.userId, date, hours])
    );

    await Promise.all(insertPromises);
    res.json({ message: 'Schedule updated successfully' });
  } catch (error) {
    console.error('Bulk schedule error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Schedule specific work day
router.post('/schedule', authenticateToken, [
  body('date').isISO8601().toDate(),
  body('hours').isFloat({ min: 0, max: 24 }).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, hours = 8 } = req.body;

    await db.query(`
      INSERT INTO scheduled_work_days (user_id, scheduled_date, planned_hours)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE planned_hours = VALUES(planned_hours)
    `, [req.user.userId, date, hours]);

    res.json({ message: 'Work day scheduled successfully' });
  } catch (error) {
    console.error('Schedule work day error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove scheduled work day
router.delete('/schedule/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;

    const result = await db.query(
      'DELETE FROM scheduled_work_days WHERE user_id = ? AND scheduled_date = ?',
      [req.user.userId, date]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Scheduled day not found' });
    }

    res.json({ message: 'Scheduled day removed successfully' });
  } catch (error) {
    console.error('Remove scheduled day error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Skip specific scheduled day
router.post('/schedule/skip/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;

    await db.query(`
      INSERT INTO skipped_work_days (user_id, skipped_date, reason)
      VALUES (?, ?, 'manually_skipped')
      ON DUPLICATE KEY UPDATE reason = VALUES(reason)
    `, [req.user.userId, date]);

    res.json({ message: 'Work day skipped successfully' });
  } catch (error) {
    console.error('Skip work day error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Unskip specific day (remove from skipped days)
router.delete('/schedule/skip/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;

    const result = await db.query(
      'DELETE FROM skipped_work_days WHERE user_id = ? AND skipped_date = ?',
      [req.user.userId, date]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Skipped day not found' });
    }

    res.json({ message: 'Day unskipped successfully' });
  } catch (error) {
    console.error('Unskip work day error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get calendar monthly data (for schedule integration)
router.get('/calendar/monthly', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month || (currentDate.getMonth() + 1);
    const targetYear = year || currentDate.getFullYear();

    // Get scheduled work days for the month
    const scheduledDays = await db.query(`
      SELECT 
        DATE_FORMAT(scheduled_date, '%Y-%m-%d') as work_date,
        planned_hours as hours,
        false as is_recurring,
        'scheduled' as status
      FROM scheduled_work_days 
      WHERE user_id = ? AND MONTH(scheduled_date) = ? AND YEAR(scheduled_date) = ?
    `, [req.user.userId, targetMonth, targetYear]);

    // Get actual work days for the month
    const workedDays = await db.query(`
      SELECT 
        wd.id,
        DATE_FORMAT(wd.work_date, '%Y-%m-%d') as work_date,
        wd.hours_worked as hours,
        ROUND(wd.hours_worked * (
          SELECT r.hourly_rate FROM user_hourly_rates r
          WHERE r.user_id = wd.user_id AND r.effective_from <= wd.work_date
          ORDER BY r.effective_from DESC
          LIMIT 1
        ), 2) as calculated_payment,
        wd.tips_amount,
        wd.payment_status,
        wd.notes,
        'worked' as status
      FROM work_days wd
      JOIN user u ON wd.user_id = u.id
      WHERE wd.user_id = ? AND MONTH(wd.work_date) = ? AND YEAR(wd.work_date) = ?
    `, [req.user.userId, targetMonth, targetYear]);

    // Get skipped days
    const skippedDays = await db.query(`
      SELECT 
        DATE_FORMAT(skipped_date, '%Y-%m-%d') as work_date,
        0 as hours,
        'skipped' as status,
        reason
      FROM skipped_work_days 
      WHERE user_id = ? AND MONTH(skipped_date) = ? AND YEAR(skipped_date) = ?
    `, [req.user.userId, targetMonth, targetYear]);

    // Combine all data and prioritize worked > skipped > scheduled
    const allDaysMap = new Map();
    
    // Add scheduled days first (lowest priority)
    scheduledDays.forEach(day => {
      allDaysMap.set(day.work_date, day);
    });
    
    // Add skipped days (higher priority than scheduled)
    skippedDays.forEach(day => {
      allDaysMap.set(day.work_date, day);
    });
    
    // Add worked days last (highest priority)
    workedDays.forEach(day => {
      allDaysMap.set(day.work_date, day);
    });
    
    const allDays = Array.from(allDaysMap.values());
    
    res.json(allDays);
  } catch (error) {
    console.error('Get calendar monthly error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get tips summary
router.get('/tips/summary', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const tipsSummary = await db.query(`
      SELECT 
        COUNT(*) as days_with_tips,
        ROUND(SUM(IFNULL(tips_amount, 0)), 2) as total_tips,
        ROUND(AVG(IFNULL(tips_amount, 0)), 2) as avg_tips_per_day,
        ROUND(MAX(IFNULL(tips_amount, 0)), 2) as max_tips_day,
        ROUND(MIN(CASE WHEN tips_amount > 0 THEN tips_amount END), 2) as min_tips_day
      FROM work_days 
      WHERE user_id = ? AND MONTH(work_date) = ? AND YEAR(work_date) = ?
    `, [req.user.userId, currentMonth, currentYear]);

    res.json(tipsSummary[0]);
  } catch (error) {
    console.error('Get tips summary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get payment summary
router.get('/payment/summary', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const paymentSummary = await db.query(`
      SELECT 
        payment_status,
        COUNT(*) as days_count,
        ROUND(SUM(hours_worked * (
          SELECT r.hourly_rate FROM user_hourly_rates r
          WHERE r.user_id = wd.user_id AND r.effective_from <= wd.work_date
          ORDER BY r.effective_from DESC
          LIMIT 1
        )), 2) as total_earnings,
        ROUND(SUM(IFNULL(tips_amount, 0)), 2) as total_tips
      FROM work_days wd
      WHERE user_id = ? AND MONTH(work_date) = ? AND YEAR(work_date) = ?
      GROUP BY payment_status
    `, [req.user.userId, currentMonth, currentYear]);

    // Format the response
    const summary = {
      pending: { days_count: 0, total_earnings: 0, total_tips: 0 },
      paid: { days_count: 0, total_earnings: 0, total_tips: 0 }
    };

    paymentSummary.forEach(row => {
      summary[row.payment_status] = {
        days_count: row.days_count,
        total_earnings: row.total_earnings || 0,
        total_tips: row.total_tips || 0
      };
    });

    res.json(summary);
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
