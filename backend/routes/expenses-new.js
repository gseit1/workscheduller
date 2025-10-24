const express = require('express');
const { authenticateToken } = require('./auth-new');
const router = express.Router();

// Get expenses
router.get('/', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.expense;
  controller.getExpenses(req, res);
});

// Create expense
router.post('/', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.expense;
  controller.createExpense(req, res);
});

// Update expense
router.put('/:id', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.expense;
  controller.updateExpense(req, res);
});

// Delete expense
router.delete('/:id', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.expense;
  controller.deleteExpense(req, res);
});

// Get summary
router.get('/summary', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.expense;
  controller.getSummary(req, res);
});

// Get category summary
router.get('/categories', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.expense;
  controller.getCategorySummary(req, res);
});

module.exports = router;
