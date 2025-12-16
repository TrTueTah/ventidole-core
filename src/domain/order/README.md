# Order & Payment System Documentation

Complete implementation of order creation and payment processing with PayOS integration (CREDIT) and Cash on Delivery (COD) support.

## Table of Contents

1. [Overview](#overview)
2. [Payment Methods](#payment-methods)
3. [Order Lifecycle](#order-lifecycle)
4. [API Endpoints](#api-endpoints)
5. [Webhook Integration](#webhook-integration)
6. [Database Schema](#database-schema)
7. [Environment Configuration](#environment-configuration)
8. [Security Principles](#security-principles)
9. [Testing](#testing)

## Overview

This system handles complete order and payment workflows for both online payments (CREDIT via PayOS) and Cash on Delivery (COD).

### Key Features

- ✅ Order confirmation with automatic payment creation
- ✅ PayOS QR code payment integration
- ✅ Payment retry mechanism
- ✅ Webhook-based payment confirmation (single source of truth)
- ✅ Idempotent webhook handling
- ✅ Order status polling for frontend
- ✅ COD support
- ✅ Unique orderCode generation
- ✅ Signature verification for webhooks

## Payment Methods

### CREDIT (PayOS)

Online payment via PayOS QR code or checkout URL.

**Flow:**

```
User confirms order
  → Order created (PENDING_PAYMENT)
  → PaymentTransaction created (PENDING)
  → PayOS payment link generated
  → User scans QR / opens checkout URL
  → User completes payment via banking app
  → PayOS sends webhook
  → Order → PAID
```

### COD (Cash on Delivery)

Payment collected on delivery.

**Flow:**

```
User confirms order
  → Order created (CONFIRMED)
  → No payment transaction needed
```

## Order Lifecycle

### Order Status Flow

```
CREDIT:
PENDING_PAYMENT → PAID → SHIPPING → DELIVERED
       ↓
   EXPIRED (after 30 min timeout)
       ↓
   CANCELED

COD:
CONFIRMED → SHIPPING → DELIVERED
    ↓
CANCELED
```

### Payment Transaction Status

```
PENDING → PAID
   ↓
FAILED / CANCELED / EXPIRED
```

## API Endpoints

### 1. Confirm Order

**Endpoint:** `POST /orders/confirm`

**Authentication:** Required (JWT)

**Request:**

```json
{
  "items": [
    {
      "productId": "cm1abc123xyz",
      "variantId": "cm1variant123",
      "quantity": 2
    }
  ],
  "paymentMethod": "CREDIT",
  "shippingAddressId": "cm1address123"
}
```

**Response (CREDIT):**

```json
{
  "orderId": "cm1order123xyz",
  "status": "PENDING_PAYMENT",
  "paymentMethod": "CREDIT",
  "totalAmount": 150000,
  "payment": {
    "provider": "PAYOS",
    "orderCode": 123456789012,
    "paymentLinkId": "abc123xyz",
    "checkoutUrl": "https://pay.payos.vn/abc123xyz",
    "qrCode": "data:image/png;base64,..."
  },
  "createdAt": "2025-12-16T10:30:00.000Z"
}
```

**Response (COD):**

```json
{
  "orderId": "cm1order123xyz",
  "status": "CONFIRMED",
  "paymentMethod": "COD",
  "totalAmount": 150000,
  "createdAt": "2025-12-16T10:30:00.000Z"
}
```

### 2. Retry Payment

**Endpoint:** `POST /orders/:orderId/retry-payment`

**Authentication:** Required (JWT)

**Preconditions:**

- Order exists
- Order belongs to current user
- Order status = PENDING_PAYMENT
- Payment method = CREDIT
- No existing PAID transaction

**Response:**

```json
{
  "orderId": "cm1order123xyz",
  "status": "PENDING_PAYMENT",
  "paymentMethod": "CREDIT",
  "totalAmount": 150000,
  "payment": {
    "provider": "PAYOS",
    "orderCode": 987654321098,
    "paymentLinkId": "xyz789abc",
    "checkoutUrl": "https://pay.payos.vn/xyz789abc",
    "qrCode": "data:image/png;base64,..."
  },
  "createdAt": "2025-12-16T10:30:00.000Z"
}
```

### 3. Get Order Status

**Endpoint:** `GET /orders/:orderId`

**Authentication:** Required (JWT)

**Purpose:** Frontend polling to check payment status

**Response:**

```json
{
  "orderId": "cm1order123xyz",
  "status": "PAID",
  "paymentMethod": "CREDIT",
  "totalAmount": 150000,
  "createdAt": "2025-12-16T10:30:00.000Z"
}
```

## Webhook Integration

### PayOS Webhook

**Endpoint:** `POST /webhooks/payos`

**Authentication:** None (signature verification only)

**Requirements:**

- ✅ Must be publicly accessible
- ✅ Must use HTTPS
- ✅ Must respond with HTTP 200 within 5 seconds
- ✅ Must be idempotent

**Webhook Payload:**

```json
{
  "code": "00",
  "desc": "success",
  "data": {
    "orderCode": 123456789012,
    "amount": 150000,
    "status": "PAID"
  },
  "signature": "hmac_sha256_signature_here"
}
```

**Processing Logic:**

```typescript
1. Verify webhook signature (CRITICAL)
2. Extract orderCode
3. Find PaymentTransaction by orderCode
4. Check idempotency (if already PAID, skip)
5. Update PaymentTransaction → PAID
6. Update Order → PAID
7. Trigger post-payment business logic
8. Return HTTP 200
```

**Idempotency:**
The webhook handler checks if the transaction is already PAID before updating. This prevents duplicate processing if PayOS retries the webhook.

## Database Schema

### Order Model

```prisma
model Order {
  id              String        @id @default(cuid())
  userId          String
  totalAmount     Float
  status          OrderStatus
  paymentMethod   PaymentMethod
  shippingAddress Json
  paidAt          DateTime?
  createdAt       DateTime
  updatedAt       DateTime

  items               OrderItem[]
  paymentTransactions PaymentTransaction[]
}

enum OrderStatus {
  PENDING_PAYMENT
  CONFIRMED
  PAID
  SHIPPING
  DELIVERED
  CANCELED
  EXPIRED
}

enum PaymentMethod {
  CREDIT
  COD
}
```

### PaymentTransaction Model

```prisma
model PaymentTransaction {
  id              String                   @id @default(cuid())
  orderId         String
  userId          String
  amount          Float
  provider        String
  orderCode       Int                      @unique
  paymentLinkId   String?
  providerTxnId   String?
  status          PaymentTransactionStatus
  paidAt          DateTime?
  checkoutUrl     String?
  qrCode          String?
  createdAt       DateTime
  updatedAt       DateTime

  order Order
  user  User
}

enum PaymentTransactionStatus {
  PENDING
  PAID
  FAILED
  CANCELED
  EXPIRED
}
```

## Environment Configuration

Add the following to your `.env` file:

```env
# PayOS Configuration
PAYOS_API_KEY=your_api_key_here
PAYOS_CLIENT_ID=your_client_id_here
PAYOS_CHECKSUM_KEY=your_checksum_key_here

# Frontend URL (for payment redirect)
FRONTEND_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DIRECT_URL=postgresql://user:password@localhost:5432/dbname
```

## Security Principles

### 🔒 Critical Rules

1. **Never trust frontend payment results**
   - Frontend redirects are for UX only
   - Webhook is the single source of truth

2. **Always verify webhook signatures**
   - Reject webhooks with invalid signatures
   - Use HMAC SHA256 verification

3. **Never reuse PayOS orderCode**
   - Each payment attempt gets a new orderCode
   - Ensures uniqueness and traceability

4. **Never expose API keys**
   - Keep PayOS credentials server-side
   - Never send to frontend

5. **Implement idempotency**
   - Check transaction status before updating
   - Handle duplicate webhook calls gracefully

### 🛡️ Additional Security

- Rate limiting on order creation
- JWT authentication for order endpoints
- Input validation on all DTOs
- SQL injection protection via Prisma ORM
- Prevent order amount manipulation by recalculating server-side

## Testing

### Local Webhook Testing

Use ngrok to expose your local server:

```bash
ngrok http 3000
```

Configure webhook URL in PayOS dashboard:

```
https://xxxx.ngrok-free.app/webhooks/payos
```

### Test Scenarios

1. **CREDIT Payment Success Flow**
   - Create order via POST /orders/confirm
   - Get payment link with QR code
   - Complete payment on PayOS
   - Verify webhook received
   - Check order status changed to PAID

2. **COD Order Flow**
   - Create order with paymentMethod: COD
   - Verify order status = CONFIRMED
   - No payment transaction created

3. **Payment Retry**
   - Create order with CREDIT
   - Call POST /orders/:id/retry-payment
   - Verify new orderCode generated
   - Old pending transactions expired

4. **Webhook Idempotency**
   - Send same webhook twice
   - Verify order only updated once
   - No duplicate business logic triggered

5. **Order Expiration**
   - Create PENDING_PAYMENT order
   - Wait 30+ minutes (or trigger manually)
   - Verify order status → EXPIRED

### Manual Webhook Testing

```bash
curl -X POST http://localhost:3000/webhooks/payos \
  -H "Content-Type: application/json" \
  -d '{
    "code": "00",
    "desc": "success",
    "data": {
      "orderCode": 123456789012,
      "amount": 150000,
      "status": "PAID"
    },
    "signature": "valid_signature_here"
  }'
```

## Migration

Run Prisma migration to update database schema:

```bash
npx prisma migrate dev --name add_order_payment_system
```

Generate Prisma client:

```bash
npx prisma generate
```

## Architecture Diagram

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │ POST /orders/confirm
       ↓
┌──────────────────────────────┐
│    OrderController           │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│      OrderService            │
│  ┌─────────────────────┐     │
│  │ validateAndCalculate│     │
│  │ createOrder         │     │
│  └─────────────────────┘     │
└──────┬───────────────────────┘
       │
       ↓ (if CREDIT)
┌──────────────────────────────┐
│ PaymentTransactionService    │
│  ┌─────────────────────┐     │
│  │ generateOrderCode   │     │
│  │ createTransaction   │     │
│  └─────────────────────┘     │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│      PayOSService            │
│  ┌─────────────────────┐     │
│  │ createPayment       │     │
│  │ generateSignature   │     │
│  └─────────────────────┘     │
└──────┬───────────────────────┘
       │
       ↓
   PayOS API
       │
       ↓ (user pays)
       │
       ↓ webhook
┌──────────────────────────────┐
│   WebhookController          │
│  ┌─────────────────────┐     │
│  │ verifySignature     │     │
│  │ handlePaymentSuccess│     │
│  └─────────────────────┘     │
└──────────────────────────────┘
```

## Summary

This implementation follows all requirements:

✅ Order created ONLY on confirmation
✅ Cart does NOT create order
✅ Payment confirmation is async
✅ Webhook is single source of truth
✅ OrderCode is numeric and unique
✅ Idempotency enforced
✅ CREDIT and COD support
✅ Proper status transitions
✅ Signature verification
✅ Security best practices
✅ 30-minute timeout handling
✅ Payment retry mechanism

The system is production-ready and follows enterprise-grade security and reliability patterns.
