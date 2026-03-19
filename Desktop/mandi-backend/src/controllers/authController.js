const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '1d' } // 24h for access token (adjustable)
  );
  
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'mandi_elite_refresh_secret',
    { expiresIn: '30d' }
  );
  
  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ status: 'ERROR', message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'Operations Staff'
    });
    
    await user.save();
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    res.status(201).json({
      status: 'SUCCESS',
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email or username
    const user = await User.findOne({ $or: [{ email: email }, { username: email }] });
    if (!user) {
      return res.status(400).json({ status: 'ERROR', message: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (!user.active) {
      return res.status(403).json({ status: 'ERROR', message: 'Account disabled. Contact Admin.' });
    }
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'ERROR', message: 'Invalid credentials' });
    }
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    res.status(200).json({
      status: 'SUCCESS',
      message: 'Logged in successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
};

exports.logout = (req, res) => {
  // Client should simply discard their tokens. Server side logout with JWT is stateless.
  // Optionally, you could implement token blacklisting with Redis here.
  res.status(200).json({ status: 'SUCCESS', message: 'Logged out successfully' });
};

exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(401).json({ status: 'ERROR', message: 'Refresh token required' });
    
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'mandi_elite_refresh_secret');
    const user = await User.findById(decoded.id);
    
    if (!user || !user.active) {
      return res.status(403).json({ status: 'ERROR', message: 'Invalid or inactive user' });
    }
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    res.status(200).json({
      status: 'SUCCESS',
      accessToken,
      refreshToken
    });
  } catch (err) {
    res.status(403).json({ status: 'ERROR', message: 'Invalid refresh token' });
  }
};
