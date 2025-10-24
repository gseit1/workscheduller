const express = require('express');
const { authenticateToken } = require('./auth-new');
const router = express.Router();

// Get dashboard overview
router.get('/overview', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.dashboard;
  controller.getOverview(req, res);
});

// Get yearly stats
router.get('/yearly', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.dashboard;
  controller.getYearlyStats(req, res);
});

module.exports = router;
