const razorpay = require('../config/razorpay');
const Payment = require('../models/Payment');
const Reconciliation = require('../models/Reconciliation');
const logger = require('../utils/logger');

const reconcilePayment = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment || !payment.razorpayPaymentId) {
    return { skipped: true, reason: 'No gateway payment ID yet' };
  }

  let gw;
  try {
    gw = await razorpay.payments.fetch(payment.razorpayPaymentId);
  } catch (err) {
    logger.error('Razorpay fetch failed', { error: err.message });
    return { skipped: true, reason: 'Gateway fetch failed' };
  }

  const localStatus = payment.status;
  const gatewayStatus = gw.status;
  const localAmount = payment.amount;
  const gatewayAmount = gw.amount;

  const statusMismatch = localStatus !== gatewayStatus;
  const amountMismatch = localAmount !== gatewayAmount;
  const discrepancy = statusMismatch || amountMismatch;

  let discrepancyType = 'ok';
  if (statusMismatch) discrepancyType = 'status_mismatch';
  else if (amountMismatch) discrepancyType = 'amount_mismatch';

  let autoHealed = false;

  if (statusMismatch && gatewayStatus === 'captured' && localStatus !== 'captured') {
    await Payment.findByIdAndUpdate(paymentId, { status: 'captured' });
    autoHealed = true;
    logger.info('Auto-healed', { from: localStatus, to: 'captured' });
  }

  const record = await Reconciliation.create({
    payment: payment._id,
    razorpayPaymentId: payment.razorpayPaymentId,
    localStatus,
    gatewayStatus,
    localAmount,
    gatewayAmount,
    discrepancy,
    discrepancyType,
    autoHealed
  });

  return { record, discrepancy, autoHealed };
};

const runBatchReconciliation = async () => {
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
  const payments = await Payment.find({
    status: { $in: ['created', 'authorized'] },
    createdAt: { $lt: tenMinsAgo },
    razorpayPaymentId: { $exists: true }
  }).limit(50);

  logger.info('Batch recon started', { count: payments.length });
  const results = await Promise.allSettled(payments.map(p => reconcilePayment(p._id.toString())));
  const healed = results.filter(r => r.status === 'fulfilled' && r.value?.autoHealed).length;
  return { total: payments.length, healed };
};

module.exports = { reconcilePayment, runBatchReconciliation };
