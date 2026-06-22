const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Application rate limit reached.' }
});

module.exports = { apiLimiter, applicationLimiter };
