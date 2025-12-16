PayOS Payment Gateway Integration (NestJS)

This module provides PayOS payment gateway integration for QR code–based payments, designed for NestJS backend services.

The module supports:

Creating PayOS payment links (QR / checkout URL)

Signature generation (HMAC SHA256)

Production-ready response mapping

Future webhook handling (payment status confirmation)

1. Environment Configuration

Add the following environment variables to your .env file:

PAYOS_API_KEY=your_api_key_here
PAYOS_CLIENT_ID=your_client_id_here
PAYOS_CHECKSUM_KEY=your_checksum_key_here

Description
Variable Description
PAYOS_API_KEY API key provided by PayOS
PAYOS_CLIENT_ID Merchant client ID
PAYOS_CHECKSUM_KEY Secret key used to sign requests and verify webhooks

⚠️ These keys must never be exposed to frontend clients.

2. Payment Flow Overview
   Client (FE)
   → Backend (NestJS)
   → PayOS API (create payment link)
   → Return QR code / checkout URL
   → User completes payment via banking app
   → (Webhook – future)
   → Backend confirms payment status

❗ Do NOT rely on returnUrl or frontend callbacks to confirm payment success.
Payment confirmation must be handled via PayOS Webhook.

3. Creating a Payment
   Service Usage Example
   import { Injectable } from '@nestjs/common';
   import { PayOSService } from '@shared/service/payment-gateway/payos.service';

@Injectable()
export class OrderService {
constructor(private readonly payosService: PayOSService) {}

async createPayment(orderId: number, amount: number) {
const paymentData = {
orderCode: orderId,
amount,
description: `Payment for order #${orderId}`,
cancelUrl: 'https://your-domain.com/payment/cancel',
returnUrl: 'https://your-domain.com/payment/success',
};

    const response = await this.payosService.createPayment(paymentData);

    return {
      qrCode: response.data.qrCode,
      checkoutUrl: response.data.checkoutUrl,
      paymentLinkId: response.data.paymentLinkId,
    };

}
}

4. Create Payment Request Contract
   Request Payload
   {
   orderCode: number; // Must be unique
   amount: number; // Amount in VND
   description: string; // Payment description
   cancelUrl: string; // Redirect if user cancels
   returnUrl: string; // Redirect after payment attempt
   }

Important Rules

orderCode must be unique

amount must be integer (VND)

Do not reuse orderCode across multiple payment attempts

5. PayOS API Response Structure
   {
   code: "00",
   desc: "success",
   data: {
   bin: "970422",
   accountNumber: "113366668888",
   accountName: "NGUYEN VAN A",
   amount: 10000,
   description: "Payment for order #123",
   orderCode: 123,
   currency: "VND",
   paymentLinkId: "abc123xyz",
   status: "PENDING",
   checkoutUrl: "https://pay.payos.vn/abc123xyz",
   qrCode: "data:image/png;base64,..."
   },
   signature: "..."
   }

Field Notes
Field Description
paymentLinkId Unique PayOS payment identifier
status Initial status is always PENDING
checkoutUrl Redirect-based payment option
qrCode Base64-encoded QR image 6. Signature Handling

Request signatures are generated automatically using HMAC SHA256

Signature generation uses:

PAYOS_CHECKSUM_KEY

All request parameters are:

Sorted alphabetically

Joined using key=value format

Signed using SHA256 HMAC

Signature verification for webhooks will use the same checksum key.

7. Webhook Integration (Payment Confirmation)

PayOS webhook is the only trusted mechanism to confirm payment results.
Frontend redirects (returnUrl) are not reliable and must be used for UX only.

7.1 Webhook Endpoint
POST /webhooks/payos

Requirements

Must be publicly accessible

Must support HTTPS

Must NOT require authentication (no JWT / API key)

Must respond with HTTP 200 within ≤ 5 seconds

7.2 Webhook Payload Structure
{
code: "00",
desc: "success",
data: {
orderCode: 123456,
amount: 10000,
status: "PAID"
},
signature: "hmac_sha256_signature"
}

Payload Fields
Field Description
code "00" indicates successful webhook event
data.orderCode Order identifier used when creating payment
data.amount Paid amount (VND)
data.status Payment status (PAID, FAILED, CANCELED, EXPIRED)
signature HMAC SHA256 signature from PayOS
7.3 Webhook Signature Verification

Every webhook request must be verified using PAYOS_CHECKSUM_KEY.

Signature Verification Rules

Extract data object

Sort keys alphabetically

Build string using key=value joined by &

Generate HMAC SHA256 hash

Compare with signature

Example Verification Logic
import \* as crypto from 'crypto';

function verifyPayOSWebhook(
data: Record<string, any>,
signature: string,
checksumKey: string,
): boolean {
const rawData = Object.keys(data)
.sort()
.map((key) => `${key}=${data[key]}`)
.join('&');

const expectedSignature = crypto
.createHmac('sha256', checksumKey)
.update(rawData)
.digest('hex');

return expectedSignature === signature;
}

❌ If verification fails, the webhook must be rejected.

7.4 Webhook Handling Logic (Recommended)
POST /webhooks/payos

if (!verifySignature) {
return 400;
}

if (transaction.status === 'PAID') {
return 200; // idempotent handling
}

switch (data.status) {
case 'PAID':
markTransactionAsPaid();
triggerBusinessLogic();
break;

case 'FAILED':
case 'CANCELED':
case 'EXPIRED':
markTransactionAsFailed();
break;
}

return 200;

7.5 Idempotency & Retry Handling

PayOS may retry webhook delivery if:

Timeout occurs

Non-200 response is returned

Required Safeguards

Check transaction status before updating

Ignore duplicate PAID events

Use orderCode as idempotency key

⚠️ Webhook handlers must be idempotent

7.6 Transaction Status Mapping
PayOS Status Internal Status
PAID PAID
FAILED FAILED
CANCELED CANCELED
EXPIRED EXPIRED
7.7 Business Logic Triggering

After a successful PAID webhook:

Activate order

Grant digital goods

Top-up credits

Enable membership

Send notification / email

These actions must never be triggered from frontend.

7.8 Webhook Testing (Local Development)

When running locally:

Use ngrok or cloudflared

Expose your local server to the internet

Example:

ngrok http 3000

Webhook URL:

https://xxxx.ngrok-free.app/webhooks/payos

7.9 Logging & Monitoring (Strongly Recommended)

Log every webhook payload

Log signature verification result

Log state transitions

Store raw webhook data for debugging

7.10 Security Notes

Do NOT expose webhook endpoint publicly in docs

Do NOT allow GET requests

Do NOT trust frontend redirect results

Always verify signature

7.11 Webhook as Source of Truth

Webhook is the single source of truth for payment success.

Frontend should:

Poll backend for payment status

Or receive updates via WebSocket
