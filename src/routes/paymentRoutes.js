const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const { reconcilePayment, runBatchReconciliation } = require('../services/reconciliationService');

router.post('/intent', async (req, res, next) => {
  try {
    const { studentId, jobId, amount, currency, description } = req.body;
    if (!studentId || !amount) {
      return res.status(400).json({ success: false, error: 'studentId and amount required' });
    }
    const intent = await paymentService.createPaymentIntent({ studentId, jobId, amount, currency, description });
    res.status(201).json({ success: true, data: intent });
  } catch (err) { next(err); }
});

router.post('/verify', async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const payment = await paymentService.capturePayment({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature
    });
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
});

router.get('/student/:studentId', async (req, res, next) => {
  try {
    const payments = await paymentService.getStudentPayments(req.params.studentId);
    res.json({ success: true, count: payments.length, data: payments });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
});

router.post('/:id/refund', async (req, res, next) => {
  try {
    const refund = await paymentService.initiateRefund(req.params.id, req.body.reason);
    res.json({ success: true, data: refund });
  } catch (err) { next(err); }
});

router.post('/reconcile/batch', async (req, res, next) => {
  try {
    const result = await runBatchReconciliation();
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/:id/reconcile', async (req, res, next) => {
  try {
    const result = await reconcilePayment(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

module.exports = router;
