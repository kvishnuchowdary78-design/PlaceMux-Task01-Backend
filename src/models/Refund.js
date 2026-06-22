const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
  razorpayRefundId: { type: String, unique: true, sparse: true },
  razorpayPaymentId: { type: String, required: true },
  amount: { type: Number, required: true },
  reason: { type: String },
  status: {
    type: String,
    enum: ['initiated', 'processed', 'failed'],
    default: 'initiated'
  }
}, { timestamps: true });

module.exports = mongoose.model('Refund', refundSchema);
