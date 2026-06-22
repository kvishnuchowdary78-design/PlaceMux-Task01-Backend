const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String, unique: true, sparse: true },
  razorpaySignature: { type: String },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
    default: 'created'
  },
  description: { type: String },
  metadata: { type: Map, of: String, default: {} },
  idempotencyKey: { type: String, required: true, unique: true }
}, { timestamps: true });

paymentSchema.index({ student: 1, status: 1 });
paymentSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
