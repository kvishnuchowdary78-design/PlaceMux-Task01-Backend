require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { apiLimiter } = require('./src/middleware/rateLimiter');
const { errorHandler } = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');

// Register all models
require('./src/models/Company');
require('./src/models/Student');
require('./src/models/Job');
require('./src/models/Application');
require('./src/models/Payment');
require('./src/models/WebhookLog');
require('./src/models/Refund');
require('./src/models/Reconciliation');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// Webhook BEFORE express.json (needs raw body)
app.use('/api/webhooks', require('./src/routes/webhookRoutes'));

app.use(express.json());
app.use(apiLimiter);

// Routes
app.use('/api/jobs', require('./src/routes/jobRoutes'));
app.use('/api/applications', require('./src/routes/applicationRoutes'));
app.use('/api/payments', require('./src/routes/paymentRoutes'));

app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    logger.info('MongoDB connected');
    app.listen(PORT, () => logger.info('Server on port ' + PORT));
  })
  .catch(err => {
    logger.error('DB connection failed', { error: err.message });
    process.exit(1);
  });