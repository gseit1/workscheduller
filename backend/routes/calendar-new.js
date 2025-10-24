const express = require('express');
const { authenticateToken } = require('./auth-new');
const router = express.Router();

// Get events
router.get('/events', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.calendar;
  controller.getEvents(req, res);
});

// Create event
router.post('/events', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.calendar;
  controller.createEvent(req, res);
});

// Update event
router.put('/events/:id', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.calendar;
  controller.updateEvent(req, res);
});

// Delete event
router.delete('/events/:id', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.calendar;
  controller.deleteEvent(req, res);
});

// Schedule work day (alias for create event with eventType='work')
router.post('/schedule', authenticateToken, (req, res) => {
  req.body.eventType = 'work';
  const controller = req.app.locals.controllers.calendar;
  controller.createEvent(req, res);
});

// Unschedule work day (alias for delete event)
router.delete('/schedule/:id', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.calendar;
  controller.deleteEvent(req, res);
});

module.exports = router;
