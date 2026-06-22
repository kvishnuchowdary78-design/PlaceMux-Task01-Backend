const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.path });

  if (err.isOperational) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, error: errors.join(', ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, error: 'Duplicate: ' + field });
  }
  return res.status(500).json({ success: false, error: 'Internal server error' });
};

module.exports = { errorHandler, AppError };
