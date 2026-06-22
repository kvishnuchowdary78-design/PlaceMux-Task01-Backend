const mongoose = require('mongoose');

const reconciliationSchema = new mongoose.Schema({
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
  razorpayPaymentId: { type: String },
  localStatus: { type: String },
  gatewayStatus: { type: String },
  localAmount: { type: Number },
  gatewayAmount: { type: Number },
  discrepancy: { type: Boolean, default: false },
  discrepancyType: {
    type: String,
    enum: ['status_mismatch', 'amount_mismatch', 'ok'],
    default: 'ok'
  },
  autoHealed: { type: Boolean, default: false },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Reconciliation', reconciliationSchema);
