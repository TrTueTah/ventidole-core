# Order & Payment System - Setup & Migration Guide

## Step 1: Environment Variables

Add to your `.env` file:

```env
# Frontend URL (for payment redirects)
FRONTEND_URL=https://your-frontend-domain.com

# PayOS Configuration (if not already added)
PAYOS_API_KEY=your_api_key_here
PAYOS_CLIENT_ID=your_client_id_here
PAYOS_CHECKSUM_KEY=your_checksum_key_here
```

**Note:** For local development, you can use:

```env
FRONTEND_URL=http://localhost:3001
```

## Step 2: Database Migration

### Update Prisma Schema

The schema has been updated with:

- New enums: `PaymentMethod`, updated `OrderStatus`, updated `PaymentTransactionStatus`
- Updated `Order` model with `paymentMethod` field
- Updated `PaymentTransaction` model with `orderCode`, `paymentLinkId`, `checkoutUrl`, `qrCode` fields

### Run Migration

```bash
# Create and apply migration
npx prisma migrate dev --name add_order_payment_system

# Generate Prisma client
npx prisma generate
```

### Migration SQL Preview

The migration will:

1. Add `PaymentMethod` enum with values: `CREDIT`, `COD`
2. Update `OrderStatus` enum with new values: `PENDING_PAYMENT`, `CONFIRMED`, `PAID`, `SHIPPING`, `DELIVERED`, `CANCELED`, `EXPIRED`
3. Update `PaymentTransactionStatus` enum with new values: `PENDING`, `PAID`, `FAILED`, `CANCELED`, `EXPIRED`
4. Alter `Order` table:
   - Change `paymentMethod` from `VARCHAR(50)` to `PaymentMethod` enum
5. Alter `PaymentTransaction` table:
   - Add `orderCode` INT UNIQUE NOT NULL
   - Add `paymentLinkId` VARCHAR(255)
   - Add `checkoutUrl` TEXT
   - Add `qrCode` TEXT
   - Add index on `orderCode`

### Handle Existing Data

If you have existing orders in your database:

```sql
-- Update existing orders to use new enum values
-- This depends on your current data structure
-- Example:
UPDATE "order" SET payment_method = 'COD' WHERE payment_method = 'cash';
UPDATE "order" SET status = 'CONFIRMED' WHERE status = 'pending';
```

⚠️ **Warning:** Review existing data before running migration in production!

## Step 3: Verify Installation

### Check Module Registration

Verify that `OrderModule` is imported in `app.module.ts`:

```typescript
import { OrderModule } from '@domain/order/order.module';

@Module({
  imports: [
    // ... other modules
    OrderModule,
    // ... other modules
  ],
})
export class AppModule {}
```

✅ This is already done in the implementation.

### Check Environment Config

Verify `FRONTEND_URL` is added to `env.config.ts`:

```typescript
@IsString()
@IsNotEmpty()
FRONTEND_URL: string;
```

✅ This is already done in the implementation.

## Step 4: PayOS Webhook Configuration

### Production Webhook URL

Configure in PayOS Dashboard:

```
https://your-api-domain.com/webhooks/payos
```

### Local Development Webhook URL

Use ngrok for local testing:

```bash
# Install ngrok (if not already installed)
brew install ngrok  # macOS
# or download from https://ngrok.com/download

# Start ngrok
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)
# Configure in PayOS Dashboard:
https://abc123.ngrok-free.app/webhooks/payos
```

### Webhook Requirements

Ensure your webhook endpoint:

- ✅ Is publicly accessible via HTTPS
- ✅ Responds within 5 seconds
- ✅ Returns HTTP 200 on success
- ✅ Does NOT require authentication (signature verification only)

## Step 5: Testing

### Test Order Creation (COD)

```bash
curl -X POST http://localhost:3000/orders/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "cm1product123",
        "quantity": 2
      }
    ],
    "paymentMethod": "COD",
    "shippingAddressId": "cm1address123"
  }'
```

Expected response:

```json
{
  "orderId": "cm1order123xyz",
  "status": "CONFIRMED",
  "paymentMethod": "COD",
  "totalAmount": 150000,
  "createdAt": "2025-12-16T10:30:00.000Z"
}
```

### Test Order Creation (CREDIT)

```bash
curl -X POST http://localhost:3000/orders/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "cm1product123",
        "quantity": 2
      }
    ],
    "paymentMethod": "CREDIT",
    "shippingAddressId": "cm1address123"
  }'
```

Expected response:

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

### Test Webhook (Manual)

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
    "signature": "VALID_SIGNATURE_HERE"
  }'
```

⚠️ **Note:** You need a valid signature. Generate it using:

```typescript
import { createHmac } from 'crypto';

const data = { orderCode: 123456789012, amount: 150000, status: 'PAID' };
const rawData = Object.keys(data)
  .sort()
  .map((key) => `${key}=${data[key]}`)
  .join('&');

const signature = createHmac('sha256', 'YOUR_CHECKSUM_KEY')
  .update(rawData)
  .digest('hex');
```

## Step 6: Deploy

### Pre-deployment Checklist

- [ ] Environment variables configured in production
- [ ] Database migration applied
- [ ] PayOS webhook URL configured
- [ ] HTTPS enabled
- [ ] Logging configured
- [ ] Error monitoring setup (e.g., Sentry)

### Deploy Steps

1. **Run migration in production:**

   ```bash
   npx prisma migrate deploy
   ```

2. **Restart application**

3. **Verify endpoints:**

   ```bash
   curl https://your-api.com/orders/health
   ```

4. **Test webhook endpoint:**
   ```bash
   curl https://your-api.com/webhooks/payos
   ```

## Step 7: Monitoring

### Key Metrics to Monitor

1. **Order creation rate**
   - Track successful order confirmations
   - Monitor failure rate

2. **Payment success rate**
   - Track PENDING_PAYMENT → PAID transitions
   - Monitor payment failures

3. **Webhook processing**
   - Track webhook delivery success rate
   - Monitor webhook processing time
   - Alert on signature verification failures

4. **Order expiration**
   - Monitor EXPIRED orders
   - Set up automated cleanup

### Recommended Alerts

1. **Webhook signature failure** → Immediate alert
2. **Payment success rate < 90%** → Warning
3. **Webhook processing time > 3s** → Warning
4. **Order creation failure rate > 5%** → Alert

## Step 8: Optional - Scheduled Tasks

### Expire Old Pending Orders

Add a cron job to expire old orders:

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderService } from './order.service';

@Injectable()
export class OrderScheduler {
  constructor(private readonly orderService: OrderService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async expireOldOrders() {
    await this.orderService.expireOldPendingOrders(30); // 30 minutes timeout
  }
}
```

Add `@nestjs/schedule` if not installed:

```bash
npm install @nestjs/schedule
```

## Troubleshooting

### Issue: Webhook not received

**Possible causes:**

1. Webhook URL not configured in PayOS
2. Server not publicly accessible
3. HTTPS not enabled
4. Firewall blocking requests

**Solution:**

- Verify webhook URL in PayOS dashboard
- Use ngrok for local testing
- Check server logs for incoming requests

### Issue: Signature verification failed

**Possible causes:**

1. Wrong `PAYOS_CHECKSUM_KEY`
2. Webhook payload modified
3. Sorting/formatting mismatch

**Solution:**

- Verify checksum key matches PayOS dashboard
- Check webhook payload in logs
- Test signature generation manually

### Issue: Order not updating to PAID

**Possible causes:**

1. Webhook not processed
2. Database error
3. Transaction not found

**Solution:**

- Check webhook logs
- Verify orderCode exists in database
- Check PaymentTransaction status

### Issue: Duplicate payments

**Possible causes:**

1. Idempotency not working
2. PayOS retrying webhook
3. Multiple webhook deliveries

**Solution:**

- Verify idempotency checks in code
- Check transaction status before updating
- Add database constraints

## Support

For issues or questions:

1. Check [README.md](./README.md) for API documentation
2. Review webhook logs in application
3. Check PayOS dashboard for payment status
4. Contact PayOS support for payment-specific issues

## Summary

✅ Environment variables added
✅ Database schema updated
✅ Migration created
✅ Webhook configured
✅ Testing completed
✅ Monitoring setup
✅ Production deployed

Your order and payment system is now ready! 🎉
