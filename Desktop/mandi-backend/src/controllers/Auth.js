const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/Core');

const JWT_SECRET = process.env.JWT_SECRET || 'mandi_elite_secret_2026';
const JWT_EXPIRES_IN = '8h'; // Token expires after 8 hours (one work day)

/**
 * POST /api/auth/register
 * Create a new staff/user account (Admin only in production)
 */
const register = async (req, res) => {
  try {
    const { username, password, role, staffId, name } = req.body;

    if (!username || !password || !role || !staffId) {
      return res.status(400).json({ status: 'ERROR', message: 'Username, password, role, and staffId are required.' });
    }

    const validRoles = ['Admin', 'Accountant', 'Operations Staff'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ status: 'ERROR', message: `Role must be one of: ${validRoles.join(', ')}` });
    }

    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ username }, { staffId }] });
    if (existingUser) {
      return res.status(409).json({ status: 'ERROR', message: 'Username or Staff ID already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, password: hashedPassword, role, staffId, name });
    await newUser.save();

    res.status(201).json({
      status: 'SUCCESS',
      message: `User '${username}' registered successfully as ${role}.`,
      data: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        staffId: newUser.staffId,
        name: newUser.name
      }
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ status: 'ERROR', message: 'Failed to register user.' });
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ status: 'ERROR', message: 'Username and password are required.' });
    }

    // Find user by username or staffId
    const user = await User.findOne({ $or: [{ username }, { staffId: username }] });
    if (!user) {
      return res.status(401).json({ status: 'ERROR', message: 'Invalid credentials.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: 'ERROR', message: 'Invalid credentials.' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, staffId: user.staffId, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      status: 'SUCCESS',
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          staffId: user.staffId,
          name: user.name
        }
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ status: 'ERROR', message: 'Login failed.' });
  }
};

/**
 * GET /api/auth/me
 * Get current logged-in user profile (protected route)
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ status: 'ERROR', message: 'User not found.' });
    }
    res.json({ status: 'SUCCESS', data: user });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: 'Failed to fetch user profile.' });
  }
};

/**
 * GET /api/auth/users
 * List all users - Admin only
 */
const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ status: 'SUCCESS', data: users });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: 'Failed to fetch users.' });
  }
};

/**
 * DELETE /api/auth/user/:id
 * Delete a user - Admin only
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ status: 'ERROR', message: 'User not found.' });
    }
    res.json({ status: 'SUCCESS', message: `User '${user.username}' deleted.` });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: 'Failed to delete user.' });
  }
};

/**
 * POST /api/auth/logout
 * Inform client logout status (stateless)
 */
const logout = (req, res) => {
  res.status(200).json({ status: 'SUCCESS', message: 'Logged out successfully.' });
};

module.exports = { register, login, getMe, listUsers, deleteUser, logout };
