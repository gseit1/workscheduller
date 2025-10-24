const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
  constructor(userModel) {
    this.userModel = userModel;
  }

  async register(req, res) {
    try {
      const { username, email, password, hourlyRate, currency } = req.body;

      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Check if user exists
      const existingUser = await this.userModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const existingUsername = await this.userModel.findByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await this.userModel.create({
        username,
        email,
        password: hashedPassword,
        hourlyRate: hourlyRate || 15,
        currency: currency || 'EUR'
      });

      // Generate token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          hourlyRate: user.hourlyRate,
          currency: user.currency,
          avatar: user.avatar || null
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Server error during registration' });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          hourlyRate: user.hourlyRate,
          currency: user.currency,
          avatar: user.avatar || null
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error during login' });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await this.userModel.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          hourlyRate: user.hourlyRate,
          currency: user.currency,
          avatar: user.avatar || null
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async updateProfile(req, res) {
    try {
      const { username, hourlyRate, currency, avatar } = req.body;
      const updateData = {};

      if (username) updateData.username = username;
      if (hourlyRate) updateData.hourlyRate = hourlyRate;
      if (currency) updateData.currency = currency;
      if (avatar !== undefined) updateData.avatar = avatar; // Allow empty string to remove avatar

      await this.userModel.update(req.userId, updateData);

      const updatedUser = await this.userModel.findById(req.userId);

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          hourlyRate: updatedUser.hourlyRate,
          currency: updatedUser.currency,
          avatar: updatedUser.avatar || null
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async updateAvatar(req, res) {
    try {
      const { avatar } = req.body;

      if (!avatar && avatar !== '') {
        return res.status(400).json({ error: 'Avatar data is required' });
      }

      // Validate base64 image data
      if (avatar && !avatar.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid avatar format' });
      }

      await this.userModel.update(req.userId, { avatar });

      const updatedUser = await this.userModel.findById(req.userId);

      res.json({
        message: 'Avatar updated successfully',
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          hourlyRate: updatedUser.hourlyRate,
          currency: updatedUser.currency,
          avatar: updatedUser.avatar || null
        }
      });
    } catch (error) {
      console.error('Update avatar error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = AuthController;
