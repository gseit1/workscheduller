const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Auth routes
router.post('/register', (req, res) => {
  const controller = req.app.locals.controllers.auth;
  controller.register(req, res);
});

router.post('/login', (req, res) => {
  const controller = req.app.locals.controllers.auth;
  controller.login(req, res);
});

router.get('/profile', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.auth;
  controller.getProfile(req, res);
});

router.put('/profile', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.auth;
  controller.updateProfile(req, res);
});

router.put('/avatar', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.auth;
  controller.updateAvatar(req, res);
});

router.get('/me', authenticateToken, (req, res) => {
  const controller = req.app.locals.controllers.auth;
  controller.getProfile(req, res);
});

// Health check endpoint for Render
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'job-analytics-api'
  });
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
