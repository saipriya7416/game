/**
 * GLOBAL CUSTOM ERROR HANDLER
 * Catches all controller errors and formats them into a professional JSON response.
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(`🔥 MANDI ERROR: ${err.message}`.red || `🔥 MANDI ERROR: ${err.message}`);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    return res.status(404).json({ status: 'ERROR', message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return res.status(400).json({ status: 'ERROR', message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ status: 'ERROR', message });
  }

  res.status(error.statusCode || 500).json({
    status: 'ERROR',
    message: error.message || 'Server Internal Failure'
  });
};

module.exports = errorHandler;
