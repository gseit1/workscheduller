const express = require('express');
const { authenticateToken } = require('./auth-new');
const router = express.Router();

// Get goals
router.get('/', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.goal;
  controller.getGoals(req, res);
});

// Create goal
router.post('/', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.goal;
  controller.createGoal(req, res);
});

// Update goal
router.put('/:id', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.goal;
  controller.updateGoal(req, res);
});

// Update goal progress
router.post('/:id/progress', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.goal;
  controller.updateProgress(req, res);
});

// Delete goal
router.delete('/:id', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.goal;
  controller.deleteGoal(req, res);
});

module.exports = router;
