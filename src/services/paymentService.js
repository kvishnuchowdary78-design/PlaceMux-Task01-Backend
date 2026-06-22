const razorpay = require('../config/razorpay');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const createPaymentIntent = async ({ studentId, jobId, amount, currency = 'INR', description }) => {
  const idempotencyKey = uuidv4();
  const amountInPaise = Math.round(amount * 100);

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency,
    receipt: idempotencyKey,
    notes: {
      studentId: studentId.toString(),
      jobId: jobId ? jobId.toString() : ''
    }
  });

  const payment = await Payment.create({
    razorpayOrderId: order.id,
    student: studentId,
    job: jobId,
    amount: amountInPaise,
    currency,
    description,
    idempotencyKey,
    status: 'created'
  });

  logger.info('Payment intent created', { orderId: order.id });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    paymentId: payment._id
  };
};

const capturePayment = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const crypto = require('crypto');
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(razorpayOrderId + '|' + razorpayPaymentId)
    .digest('hex');

  if (expected !== razorpaySignature) {
    throw new AppError('Invalid payment signature', 400);
  }

  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId },
    { razorpayPaymentId, razorpaySignature, status: 'captured' },
    { new: true }
  );

  if (!payment) throw new AppError('Payment record not found', 404);
  logger.info('Payment captured', { razorpayPaymentId });
  return payment;
};

const getPaymentById = async (id) => {
  const payment = await Payment.findById(id)
    .populate('student', 'name email')
    .populate('job', 'title');
  if (!payment) throw new AppError('Payment not found', 404);
  return payment;
};

const getStudentPayments = async (studentId) => {
  return Payment.find({ student: studentId }).sort({ createdAt: -1 }).lean();
};

const initiateRefund = async (paymentId, reason) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.status !== 'captured') throw new AppError('Only captured payments can be refunded', 400);

  const rzRefund = await razorpay.payments.refund(payment.razorpayPaymentId, {
    amount: payment.amount,
    notes: { reason }
  });

  const refund = await Refund.create({
    payment: payment._id,
    razorpayRefundId: rzRefund.id,
    razorpayPaymentId: payment.razorpayPaymentId,
    amount: rzRefund.amount,
    reason,
    status: 'initiated'
  });

  await Payment.findByIdAndUpdate(paymentId, { status: 'refunded' });
  logger.info('Refund initiated', { refundId: refund._id });
  return refund;
};

module.exports = { createPaymentIntent, capturePayment, getPaymentById, getStudentPayments, initiateRefund };
