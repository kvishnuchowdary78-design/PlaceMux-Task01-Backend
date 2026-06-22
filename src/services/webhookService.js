const crypto = require('crypto');
const WebhookLog = require('../models/WebhookLog');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const logger = require('../utils/logger');

const verifySignature = (rawBody, signature) => {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
};

const processWebhook = async (rawBody, signature) => {
  if (!verifySignature(rawBody, signature)) {
    logger.warn('Webhook signature mismatch');
    return { success: false, error: 'Invalid signature' };
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event;
  const entity = payload.payload?.payment?.entity || {};

  // Log FIRST before any processing
  const log = await WebhookLog.create({
    event,
    razorpayOrderId: entity.order_id,
    razorpayPaymentId: entity.id,
    payload,
    processed: false
  });

  try {
    // Idempotency: skip if this exact event was already processed
    const already = await WebhookLog.findOne({
      razorpayPaymentId: entity.id,
      processed: true,
      event,
      _id: { $ne: log._id }
    });

    if (already) {
      logger.info('Duplicate webhook skipped', { event, paymentId: entity.id });
      await WebhookLog.findByIdAndUpdate(log._id, { processed: true, processedAt: new Date() });
      return { success: true, skipped: true };
    }

    if (event === 'payment.captured') {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: entity.order_id },
        { razorpayPaymentId: entity.id, status: 'captured' }
      );
    }

    if (event === 'payment.failed') {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: entity.order_id },
        { status: 'failed' }
      );
    }

    if (event === 'refund.processed') {
      const re = payload.payload?.refund?.entity || {};
      await Refund.findOneAndUpdate({ razorpayRefundId: re.id }, { status: 'processed' });
    }

    await WebhookLog.findByIdAndUpdate(log._id, { processed: true, processedAt: new Date() });
    return { success: true };

  } catch (err) {
    await WebhookLog.findByIdAndUpdate(log._id, { error: err.message });
    logger.error('Webhook error', { error: err.message });
    return { success: false, error: err.message };
  }
};

module.exports = { processWebhook };
