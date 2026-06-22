const express = require('express');
const router = express.Router();
const { processWebhook } = require('../services/webhookService');

router.post(
  '/razorpay',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ success: false, error: 'Missing signature header' });
    }
    const rawBody = req.body.toString('utf-8');
    const result = await processWebhook(rawBody, signature);
    // Always 200 — non-200 causes Razorpay to retry
    return res.status(200).json({ received: true, ...result });
  }
);

module.exports = router;
