const mongoose = require('mongoose');

const webhookLogSchema = new mongoose.Schema({
  event: { type: String, required: true },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  payload: { type: mongoose.Schema.Types.Mixed },
  processed: { type: Boolean, default: false },
  processedAt: { type: Date },
  error: { type: String }
}, { timestamps: true });

webhookLogSchema.index({ razorpayPaymentId: 1, processed: 1 });

module.exports = mongoose.model('WebhookLog', webhookLogSchema);
