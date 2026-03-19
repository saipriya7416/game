const jwt = require('jsonwebtoken');

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Expecting "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ status: 'ERROR', message: 'Access token required for authentication' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains id, role, username
    next();
  } catch (err) {
    return res.status(403).json({ status: 'ERROR', message: 'Invalid or expired token' });
  }
};

exports.authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'ERROR', message: 'Unauthorized' });
    }
    
    // Admin gets full access
    if (req.user.role === 'Admin') {
      return next();
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'ERROR',
        message: `Forbidden: Current role (${req.user.role}) is not authorized for this action`
      });
    }
    
    next();
  };
};
