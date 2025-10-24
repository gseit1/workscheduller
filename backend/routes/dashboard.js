const express = require('express');
const authRouter = require('./auth');
const authenticateToken = authRouter.authenticateToken;
const db = require('../config/database');

const router = express.Router();

// Get dashboard overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const todayStr = currentDate.toISOString().split('T')[0];
  const startOfYearStr = startOfYear.toISOString().split('T')[0];

    // Current month work stats
    const workStatsQuery = await db.query(`
      SELECT 
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
      WHERE user_id = ? AND MONTH(work_date) = ? AND YEAR(work_date) = ?
    `, [req.user.userId, currentMonth, currentYear]);

    // Current month expense stats
    const expenseStatsQuery = await db.query(`
      SELECT 
        type,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM expenses 
      WHERE user_id = ? AND MONTH(expense_date) = ? AND YEAR(expense_date) = ?
      GROUP BY type
    `, [req.user.userId, currentMonth, currentYear]);

    // Year-to-date work stats
    const ytdWorkStatsQuery = await db.query(`
      SELECT 
        SUM(hours_worked) as total_hours,
        ROUND(SUM(hours_worked * (
          SELECT r.hourly_rate FROM user_hourly_rates r
          WHERE r.user_id = wd.user_id AND r.effective_from <= wd.work_date
          ORDER BY r.effective_from DESC
          LIMIT 1
        )), 2) as total_earnings,
        ROUND(SUM(IFNULL(tips_amount, 0)), 2) as total_tips,
        COUNT(*) as days_worked
      FROM work_days wd
      WHERE user_id = ? AND work_date BETWEEN ? AND ?
    `, [req.user.userId, startOfYearStr, todayStr]);

    // Year-to-date expense stats
    const ytdExpenseStatsQuery = await db.query(`
      SELECT 
        type,
        SUM(amount) as total_amount
      FROM expenses 
      WHERE user_id = ? AND expense_date BETWEEN ? AND ?
      GROUP BY type
    `, [req.user.userId, startOfYearStr, todayStr]);

    // Recent work days (last 7 days)
    const recentWorkDays = await db.query(`
      SELECT wd.*, u.hourly_rate, 
             ROUND(wd.hours_worked * u.hourly_rate, 2) as calculated_payment,
             ROUND(IFNULL(wd.tips_amount, 0), 2) as tips_amount
      FROM work_days wd 
      JOIN user u ON wd.user_id = u.id 
      WHERE wd.user_id = ? AND wd.work_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      ORDER BY wd.work_date DESC
      LIMIT 7
    `, [req.user.userId]);

    // Recent transactions (last 10)
    const recentTransactions = await db.query(`
      SELECT * FROM expenses 
      WHERE user_id = ? 
      ORDER BY expense_date DESC, created_at DESC 
      LIMIT 10
    `, [req.user.userId]);

    // Current user info
    const userInfo = await db.query(`
      SELECT id, username, email, hourly_rate FROM user WHERE id = ?
    `, [req.user.userId]);

    // Format expense stats
    const expenseStats = {
      income: 0,
      expense: 0,
      net: 0
    };

    expenseStatsQuery.forEach(row => {
      expenseStats[row.type] = row.total_amount || 0;
    });
    expenseStats.net = expenseStats.income - expenseStats.expense;

    // Format YTD expense stats
    const ytdExpenseStats = {
      income: 0,
      expense: 0,
      net: 0
    };
    ytdExpenseStatsQuery.forEach(row => {
      ytdExpenseStats[row.type] = row.total_amount || 0;
    });
    ytdExpenseStats.net = (ytdExpenseStats.income || 0) - (ytdExpenseStats.expense || 0);

    // Calculate weekly schedule adherence
    const scheduleAdherence = await db.query(`
      SELECT 
        ws.day_of_week,
        ws.is_work_day,
        ws.default_hours,
        COALESCE(AVG(wd.hours_worked), 0) as avg_actual_hours
      FROM work_schedule ws
      LEFT JOIN work_days wd ON ws.user_id = wd.user_id 
        AND DAYOFWEEK(wd.work_date) = ws.day_of_week + 1
        AND MONTH(wd.work_date) = ? AND YEAR(wd.work_date) = ?
      WHERE ws.user_id = ?
      GROUP BY ws.day_of_week, ws.is_work_day, ws.default_hours
      ORDER BY ws.day_of_week
    `, [currentMonth, currentYear, req.user.userId]);

    res.json({
      user: userInfo[0],
      currentMonth: {
        work: workStatsQuery[0],
        expenses: expenseStats
      },
      toDate: {
        work: ytdWorkStatsQuery[0],
        expenses: ytdExpenseStats,
        net: (ytdWorkStatsQuery[0]?.total_earnings || 0) + (ytdExpenseStats.income || 0) - (ytdExpenseStats.expense || 0)
      },
      recentActivity: {
        workDays: recentWorkDays,
        transactions: recentTransactions
      },
      scheduleAdherence
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get year overview with monthly breakdown
router.get('/year-overview', authenticateToken, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    // Monthly work earnings
    const monthlyEarnings = await db.query(`
      SELECT 
        MONTH(work_date) as month,
        SUM(hours_worked) as total_hours,
        SUM(hours_worked * (
          SELECT r.hourly_rate FROM user_hourly_rates r
          WHERE r.user_id = wd.user_id AND r.effective_from <= wd.work_date
          ORDER BY r.effective_from DESC
          LIMIT 1
        )) as total_earnings,
        COUNT(*) as days_worked
      FROM work_days wd
      WHERE user_id = ? AND YEAR(work_date) = ?
      GROUP BY MONTH(work_date)
      ORDER BY month
    `, [req.user.userId, year]);

    // Monthly expenses/income
    const monthlyExpenses = await db.query(`
      SELECT 
        MONTH(expense_date) as month,
        type,
        SUM(amount) as total_amount
      FROM expenses 
      WHERE user_id = ? AND YEAR(expense_date) = ?
      GROUP BY MONTH(expense_date), type
      ORDER BY month
    `, [req.user.userId, year]);

    // Format data for charts
    const monthlyData = {};
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = {
        month: i,
        work_earnings: 0,
        total_hours: 0,
        days_worked: 0,
        income: 0,
        expense: 0,
        net: 0
      };
    }

    monthlyEarnings.forEach(row => {
      monthlyData[row.month].work_earnings = row.total_earnings || 0;
      monthlyData[row.month].total_hours = row.total_hours || 0;
      monthlyData[row.month].days_worked = row.days_worked || 0;
    });

    monthlyExpenses.forEach(row => {
      monthlyData[row.month][row.type] = row.total_amount || 0;
    });

    // Calculate net income (work + other income - expenses)
    Object.keys(monthlyData).forEach(month => {
      const data = monthlyData[month];
      data.total_income = data.work_earnings + data.income;
      data.net = data.total_income - data.expense;
    });

    res.json({
      year: parseInt(year),
      monthlyData: Object.values(monthlyData)
    });

  } catch (error) {
    console.error('Year overview error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get upcoming work days based on schedule
router.get('/upcoming-schedule', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // Get user's work schedule
    const schedule = await db.query(`
      SELECT * FROM work_schedule WHERE user_id = ? ORDER BY day_of_week
    `, [req.user.userId]);

    // Generate upcoming work days
    const upcomingDays = [];
    const startDate = new Date();
    
    for (let i = 0; i < parseInt(days); i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday
      const scheduleDay = schedule.find(s => s.day_of_week === dayOfWeek);
      
      if (scheduleDay && scheduleDay.is_work_day) {
        // Check if already logged
        const existingWork = await db.query(`
          SELECT * FROM work_days WHERE user_id = ? AND work_date = ?
        `, [req.user.userId, currentDate.toISOString().split('T')[0]]);

        upcomingDays.push({
          date: currentDate.toISOString().split('T')[0],
          dayOfWeek: dayOfWeek,
          defaultHours: scheduleDay.default_hours,
          isLogged: existingWork.length > 0,
          loggedHours: existingWork.length > 0 ? existingWork[0].hours_worked : null
        });
      }
    }

    res.json(upcomingDays);

  } catch (error) {
    console.error('Upcoming schedule error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
