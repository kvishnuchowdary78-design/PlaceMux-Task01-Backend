#!/bin/bash
BASE=http://localhost:5000/api

STUDENT_ID="PASTE_STUDENT_ID_HERE"
JOB_ID="PASTE_JOB_ID_HERE"

echo "=== 1. Create payment intent ==="
INTENT=$(curl -s -X POST "$BASE/payments/intent" \
  -H "Content-Type: application/json" \
  -d "{
    \"studentId\": \"$STUDENT_ID\",
    \"jobId\": \"$JOB_ID\",
    \"amount\": 999,
    \"currency\": \"INR\",
    \"description\": \"Job application fee\"
  }")
echo $INTENT | python3 -m json.tool
ORDER_ID=$(echo $INTENT | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['orderId'])")
PAYMENT_ID=$(echo $INTENT | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['paymentId'])")

echo ""
echo "=== 2. Check payment status ==="
curl -s "$BASE/payments/$PAYMENT_ID" | python3 -m json.tool

echo ""
echo "=== 3. Reconcile payment ==="
curl -s -X POST "$BASE/payments/$PAYMENT_ID/reconcile" | python3 -m json.tool

echo ""
echo "=== 4. Batch reconcile ==="
curl -s -X POST "$BASE/payments/reconcile/batch" | python3 -m json.tool

echo ""
echo "Webhook URL for Razorpay dashboard:"
echo "  https://YOUR_NGROK_URL/api/webhooks/razorpay"
echo "Run: ngrok http 5000"
