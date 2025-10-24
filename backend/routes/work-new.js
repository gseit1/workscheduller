const express = require('express');
const { authenticateToken } = require('./auth-new');
const router = express.Router();

// Get work days
router.get('/days', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.work;
  controller.getWorkDays(req, res);
});

// Create work day
router.post('/days', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.work;
  controller.createWorkDay(req, res);
});

// Update work day
router.put('/days/:id', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.work;
  controller.updateWorkDay(req, res);
});

// Delete work day
router.delete('/days/:id', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.work;
  controller.deleteWorkDay(req, res);
});

// Get monthly stats
router.get('/stats', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.work;
  controller.getMonthlyStats(req, res);
});

module.exports = router;
