# Order Process Summary: User to Admin Page

Complete end-to-end order processing flow from user checkout to admin management.

---

## 🛒 User Flow

### 1. Order Creation

**Endpoint:** `POST /api/v1/orders/confirm`

**User Actions:**

- Select products with quantities
- Choose payment method: **CREDIT** (PayOS Online Payment) or **COD** (Cash on Delivery)
- Provide shipping address ID

**Request Example:**

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

**System Processing:**

1. Validates products exist and calculates total amount
2. Generates unique `orderCode` (format: `ORD-YYYYMMDD-XXXXX`)
3. Creates order with initial status:
   - **CREDIT** → `PENDING_PAYMENT`
   - **COD** → `CONFIRMED`

**For CREDIT Payment Response:**

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

**What happens:**

- Creates `PaymentTransaction` with unique PayOS `orderCode`
- Generates PayOS payment link with:
  - QR code for scanning
  - Checkout URL for web
  - Deep links for mobile app navigation (`ventidole://payment/success/:orderId` or `ventidole://payment/failure/:orderId`)
- Returns payment details to user
- Cart items NOT cleared yet (only cleared after successful payment)

**For COD Payment Response:**

```json
{
  "orderId": "cm1order123xyz",
  "status": "CONFIRMED",
  "paymentMethod": "COD",
  "totalAmount": 150000,
  "createdAt": "2025-12-16T10:30:00.000Z"
}
```

**What happens:**

- Order immediately confirmed
- Cart items cleared immediately
- Sends order confirmation notifications via:
  - Knock Workflow Service (email, SMS, push)
  - GetStream (real-time in-app notification)
- No payment transaction needed

---

### 2. Payment Processing (CREDIT only)

**User Payment Flow:**

1. User scans QR code or opens checkout URL from React Native app
2. Completes payment in banking app
3. PayOS processes payment and redirects to deep link:
   - Success: `ventidole://payment/success/:orderId`
   - Failure: `ventidole://payment/failure/:orderId`
4. React Native app handles deep link and navigates user accordingly

**Backend Webhook Processing:**

**Endpoint:** `POST /webhooks/payos` (Public, No Auth)

**Requirements:**

- Publicly accessible HTTPS endpoint
- Response within 5 seconds
- Signature verification for security

**Webhook Data:**

```json
{
  "data": {
    "orderCode": 123456789012,
    "amount": 150000,
    "description": "Thanh toan don hang",
    "accountNumber": "12345678",
    "reference": "FT21348952",
    "transactionDateTime": "2025-12-16T10:05:00.000Z"
  },
  "signature": "abc123..."
}
```

**System Processing:**

1. **Signature Verification:** Verifies PayOS webhook signature (HMAC)
2. **Find Transaction:** Looks up `PaymentTransaction` by `orderCode`
3. **Update Transaction Status:** `PENDING` → `PAID` (with `paidAt` timestamp)
4. **Update Order Status:** `PENDING_PAYMENT` → `PAID` (with `paidAt` timestamp)
5. **Clear Cart:** Removes ordered items from user's cart
6. **Send Notifications:**
   - Knock: Multi-channel payment success notification
   - GetStream: Real-time order status update event

**Idempotency:**

- Webhook can be sent multiple times by PayOS
- System safely handles duplicate webhooks
- Checks if order already marked as PAID
- No duplicate cart clearing or notifications

---

### 3. Payment Retry

**Endpoint:** `POST /api/v1/orders/:orderId/retry-payment`

**When to use:**

- Payment link expired
- User closed payment window
- Payment failed

**Preconditions:**

- Order status = `PENDING_PAYMENT`
- Payment method = `CREDIT`
- No existing `PAID` transaction

**System Processing:**

1. Validates order ownership
2. Expires old pending transactions
3. Creates new `PaymentTransaction` with fresh PayOS link
4. Returns new QR code and checkout URL

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

---

### 4. React Native Deep Link Handling

**After Payment Completion:**

PayOS redirects users back to the React Native app via deep links configured in the payment creation:

**Success Deep Link:** `ventidole://payment/success/:orderId`

```typescript
// React Native deep link handler
Linking.addEventListener('url', (event) => {
  const { url } = event;

  if (url.startsWith('ventidole://payment/success/')) {
    const orderId = url.split('/').pop();
    // Fetch latest order status
    const order = await api.get(`/orders/${orderId}`);
    // Navigate to success screen
    navigation.navigate('OrderSuccess', { order });
  }
});
```

**Failure Deep Link:** `ventidole://payment/failure/:orderId`

```typescript
// React Native deep link handler
if (url.startsWith('ventidole://payment/failure/')) {
  const orderId = url.split('/').pop();
  // Navigate to failure screen with retry option
  navigation.navigate('PaymentFailed', { orderId });
}
```

**How It Works:**

1. User completes/cancels payment in banking app
2. PayOS redirects to configured deep link (returnUrl or cancelUrl)
3. React Native Linking API captures the deep link
4. App navigates to appropriate screen based on deep link
5. Optionally fetch latest order status to confirm payment state

**Note:** Deep links provide immediate user feedback. The backend webhook updates order status asynchronously.

---

### 5. Order Status Tracking

#### Get Order Status

**Endpoint:** `GET /api/v1/orders/:orderId`

**Purpose:** Retrieve current order status and details

**Use Cases:**

- View order status after deep link redirect
- Check order details in order history
- Verify payment completion after webhook processing

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

#### Get User Orders

**Endpoint:** `GET /api/v1/orders?page=1&limit=10&status=PAID`

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `offset`: Skip items (alternative to page)
- `status`: Filter by order status (optional)

**Response:**

```json
{
  "data": [
    {
      "id": "cm1order123",
      "orderCode": "ORD-20251227-12345",
      "totalAmount": 150000,
      "status": "PAID",
      "paymentMethod": "CREDIT",
      "itemCount": 3,
      "createdAt": "2025-12-27T10:00:00Z",
      "paidAt": "2025-12-27T10:05:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

#### Get Order Details

**Endpoint:** `GET /api/v1/orders/:orderId/details`

**Response:**

```json
{
  "id": "cm1order123",
  "orderCode": "ORD-20251227-12345",
  "totalAmount": 150000,
  "status": "PAID",
  "paymentMethod": "CREDIT",
  "shippingAddress": {
    "id": "address123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+84901234567",
    "provinceCode": 79,
    "provinceName": "Ho Chi Minh City",
    "districtCode": 760,
    "districtName": "District 1",
    "detailAddress": "123 Main Street, Apartment 5B",
    "isDefaultAddress": true
  },
  "items": [
    {
      "id": "item1",
      "productId": "prod123",
      "productName": "Espresso Blend",
      "variantId": "var123",
      "variantName": "250g",
      "price": 50000,
      "quantity": 2,
      "mediaUrls": ["https://..."]
    },
    {
      "id": "item2",
      "productId": "prod456",
      "productName": "Filter Coffee",
      "price": 50000,
      "quantity": 1,
      "mediaUrls": ["https://..."]
    }
  ],
  "createdAt": "2025-12-27T10:00:00Z",
  "paidAt": "2025-12-27T10:05:00Z",
  "updatedAt": "2025-12-27T10:05:00Z"
}
```

---

## 👨‍💼 Admin Flow

### 1. View All Orders

**Endpoint:** `GET /api/v1/admin/order`

**Admin Capabilities:**

**Query Parameters:**

- `page`, `limit`, `offset`: Pagination
- `search`: Search by username, email, or order ID
- `userId`: Filter by specific user
- `orderStatus`: Filter by order status
- `paymentStatus`: Filter by payment status
- `paymentMethod`: Filter by payment method (CREDIT/COD)
- `isActive`: Filter by active status
- `sortBy`: Sort field (createdAt, updatedAt, totalAmount, paidAt)
- `sortOrder`: asc or desc (default: desc)

**Example Request:**

```
GET /api/v1/admin/order?page=1&limit=20&orderStatus=PAID&sortBy=paidAt&sortOrder=desc
```

**Response:**

```json
{
  "data": [
    {
      "id": "cm1order123",
      "user": {
        "id": "user123",
        "username": "john_doe",
        "email": "john@example.com",
        "avatarUrl": "https://..."
      },
      "totalAmount": 150000,
      "status": "PAID",
      "paymentMethod": "CREDIT",
      "paymentStatus": "PAID",
      "itemCount": 3,
      "isActive": true,
      "paidAt": "2025-12-27T10:05:00Z",
      "createdAt": "2025-12-27T10:00:00Z",
      "updatedAt": "2025-12-27T10:05:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Key Features:**

- View all orders across all users
- Advanced filtering and search
- Sort by multiple fields
- See payment status alongside order status
- User information included

---

### 2. View Order Details

**Endpoint:** `GET /api/v1/admin/order/:id`

**Response:**

```json
{
  "id": "cm1order123",
  "user": {
    "id": "user123",
    "username": "john_doe",
    "email": "john@example.com",
    "avatarUrl": "https://..."
  },
  "totalAmount": 150000,
  "status": "PAID",
  "shippingAddress": {
    "id": "address123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+84901234567",
    "provinceCode": 79,
    "provinceName": "Ho Chi Minh City",
    "districtCode": 760,
    "districtName": "District 1",
    "detailAddress": "123 Main Street, Apartment 5B",
    "isDefaultAddress": true
  },
  "paymentMethod": "CREDIT",
  "items": [
    {
      "id": "item1",
      "productId": "prod123",
      "product": {
        "name": "Espresso Blend"
      },
      "variantId": "var123",
      "variant": {
        "name": "250g"
      },
      "price": 50000,
      "quantity": 2
    }
  ],
  "isActive": true,
  "paidAt": "2025-12-27T10:05:00Z",
  "createdAt": "2025-12-27T10:00:00Z",
  "updatedAt": "2025-12-27T10:05:00Z",
  "version": 1,
  "metadata": {}
}
```

**Admin sees:**

- Complete order information
- Full user details
- All order items with product/variant info
- Shipping address details
- Payment status and timestamps
- Metadata and version control for audit

---

### 3. Change Order Status

**Endpoint:** `PATCH /api/v1/admin/order/:id/status`

**Request:**

```json
{
  "status": "SHIPPING"
}
```

**Valid Status Transitions:**

From `PAID` or `CONFIRMED`:

- → `SHIPPING` (Order dispatched)
- → `CANCELED` (Order cancelled)

From `SHIPPING`:

- → `DELIVERED` (Order completed)
- → `CANCELED` (Order cancelled)

**System Processing:**

1. Validates status transition is allowed
2. Updates order status
3. Sets appropriate timestamp (e.g., `deliveredAt`, `canceledAt`)
4. Sends notifications to user:
   - Knock: Multi-channel notification (email, SMS, push)
   - GetStream: Real-time in-app update
5. Logs status change for audit trail

**Notification Examples:**

**Shipping Notification:**

- Title: "Order Shipped"
- Text: "Your order ORD-20251227-12345 is on the way!"
- Metadata: tracking info, estimated delivery

**Delivered Notification:**

- Title: "Order Delivered"
- Text: "Your order ORD-20251227-12345 has been delivered. Enjoy!"

---

### 4. Additional Admin Management

#### Update Order

**Endpoint:** `PATCH /api/v1/admin/order/:id`

**Request:**

```json
{
  "shippingAddress": {
    "id": "address456",
    "firstName": "Jane",
    "lastName": "Doe",
    "phoneNumber": "+84909876543",
    "provinceCode": 1,
    "provinceName": "Hanoi",
    "districtCode": 5,
    "districtName": "District 3",
    "detailAddress": "456 New Street, Building A",
    "isDefaultAddress": false
  },
  "metadata": {
    "adminNotes": "Address updated per customer request"
  }
}
```

**Note:** While the endpoint accepts shipping address updates, in practice, the shipping address is stored as a snapshot when the order is created and should not be modified to maintain order integrity. Updates should only be done in exceptional circumstances.

**Use Cases:**

- Update shipping address
- Add internal notes
- Modify order metadata

---

#### Create Order (Manual)

**Endpoint:** `POST /api/v1/admin/order`

**Use Cases:**

- Phone orders
- Manual order entry
- Offline sales

---

#### Delete Order (Soft Delete)

**Endpoint:** `DELETE /api/v1/admin/order/:id`

**Processing:**

- Sets `isDeleted = true`
- Sets `deletedAt` timestamp
- Order hidden from normal queries
- Data preserved for audit

---

## 📊 Order Status Lifecycle

### CREDIT Payment Flow

```
User Confirms Order
       ↓
PENDING_PAYMENT (waiting for payment)
       ↓
   [User Pays]
       ↓
    PAID (payment confirmed)
       ↓
[Admin Ships Order]
       ↓
   SHIPPING (in transit)
       ↓
[Admin Confirms Delivery]
       ↓
  DELIVERED (completed)
```

**Timeout & Cancellation:**

```
PENDING_PAYMENT
       ↓ (30 min no payment)
   EXPIRED
       ↓
   CANCELED
```

### COD Payment Flow

```
User Confirms Order
       ↓
   CONFIRMED (order confirmed, payment on delivery)
       ↓
[Admin Ships Order]
       ↓
   SHIPPING (in transit)
       ↓
[Delivery + Payment Collected]
       ↓
  DELIVERED (completed)
```

**Cancellation:**

```
CONFIRMED or SHIPPING
       ↓
   CANCELED
```

---

## 💳 Payment Transaction Lifecycle

### CREDIT Payment Only

```
Order Created (PENDING_PAYMENT)
       ↓
PaymentTransaction Created (PENDING)
       ↓
PayOS Link Generated
       ↓
   [User Pays]
       ↓
PayOS Webhook Received
       ↓
Transaction Status → PAID
       ↓
Order Status → PAID
```

**Alternative Flows:**

**Payment Retry:**

```
PENDING
   ↓ (user closes payment)
EXPIRED
   ↓ (user retries payment)
New Transaction (PENDING)
```

**Payment Failure:**

```
PENDING
   ↓ (payment declined)
FAILED
```

---

## 🔔 Notification System

### Multi-Channel Notifications

**Knock Workflow Service:**

- Email notifications
- SMS notifications
- Push notifications (mobile)
- Configurable workflows per event

**GetStream Notification Channel:**

- Real-time in-app notifications
- Live order status updates
- Event streaming for instant updates

### Notification Events

| Event           | Trigger                           | Channels          | Recipient |
| --------------- | --------------------------------- | ----------------- | --------- |
| Order Confirmed | COD order created                 | Knock + GetStream | User      |
| Payment Success | PayOS webhook received            | Knock + GetStream | User      |
| Order Shipped   | Admin changes status to SHIPPING  | Knock + GetStream | User      |
| Order Delivered | Admin changes status to DELIVERED | Knock + GetStream | User      |
| Order Cancelled | Admin cancels order               | Knock + GetStream | User      |

### Notification Payload Example

```typescript
{
  userId: "user123",
  title: "Payment Successful",
  text: "Your payment of 150,000 VND has been confirmed.",
  metadata: {
    url: "/orders/cm1order123",
    orderId: "cm1order123",
    orderCode: "ORD-20251227-12345",
    amount: 150000,
    type: "order_paid"
  }
}
```

---

## 🔒 Security & Reliability

### Security Measures

**1. Webhook Signature Verification**

- PayOS signs all webhook data with HMAC
- System verifies signature before processing
- Prevents fraudulent payment confirmations
- Rejects invalid signatures immediately

**2. Authentication & Authorization**

- All user endpoints require JWT authentication
- All admin endpoints require admin role
- Order ownership validation (users only see their orders)
- HTTPS required for all endpoints

**3. Data Validation**

- Product existence validation
- Price verification from database (not client)
- Quantity limits
- Address validation

### Reliability Features

**1. Idempotent Webhook Handling**

- PayOS may send duplicate webhooks
- System checks if order already PAID
- Prevents duplicate cart clearing
- Prevents duplicate notifications
- Safe to process same webhook multiple times

**2. Unique Code Generation**

- **orderCode** (user-facing): `ORD-YYYYMMDD-XXXXX`
  - Timestamp-based with random suffix
  - Unique constraint in database
- **PayOS orderCode** (payment): Numeric timestamp + random
  - Race condition protection
  - Automatic retry if collision detected

**3. Audit Logging**

- Winston logger for all critical operations
- Order creation, payment processing, status changes
- Includes metadata: userId, orderId, amounts, timestamps
- Error tracking with stack traces

**4. Transaction Safety**

- Database transactions for order creation
- Atomic updates for status changes
- Version field for optimistic locking
- Soft deletes for data preservation

### Error Handling

**1. Payment Gateway Failures**

```typescript
try {
  payosResponse = await payosService.createPayment({...});
} catch (error) {
  WinstonLogger.error('PayOS service error', {...});
  throw new CustomError(ErrorCode.PaymentTransactionCreateFailed);
}
```

**2. Notification Failures**

```typescript
try {
  await knockWorkflowService.notifyPaymentSuccess({...});
} catch (error) {
  // Don't fail payment if notification fails
  WinstonLogger.error('Failed to send notification', {...});
}
```

**3. Webhook Processing Errors**

```typescript
try {
  await orderService.handlePaymentSuccess(orderCode);
} catch (error) {
  WinstonLogger.error('Error processing webhook', {...});
  // Still return 200 to prevent PayOS retries
  return { success: false };
}
```

---

## 🔄 Cart Management

### Cart Clearing Logic

**COD Orders:**

- Cart cleared immediately after order creation
- User sees empty cart after checkout

**CREDIT Orders:**

- Cart NOT cleared after order creation
- Cart cleared only after successful payment webhook
- Prevents cart loss if payment fails

**Implementation:**

```typescript
async clearCartItems(userId: string, productIds: string[]): Promise<void> {
  const cart = await this.prisma.cart.findUnique({
    where: { userId }
  });

  if (!cart) return;

  await this.prisma.cartItem.updateMany({
    where: {
      cartId: cart.id,
      productId: { in: productIds },
      isDeleted: false
    },
    data: {
      isDeleted: true,
      deletedAt: new Date()
    }
  });
}
```

**Soft Delete:**

- Sets `isDeleted = true`
- Sets `deletedAt` timestamp
- Data preserved for potential recovery
- Hidden from normal cart queries

---

## 📝 Database Schema

### Order Table

```prisma
model Order {
  id               String      @id @default(cuid())
  userId           String      @map("user_id")
  orderCode        String?     @unique @map("order_code") @db.VarChar(50)
  totalAmount      Decimal     @map("total_amount") @db.Decimal(10, 2)
  status           OrderStatus
  paymentMethod    PaymentMethod @map("payment_method")
  shippingAddress  Json        @map("shipping_address")
  paidAt           DateTime?   @map("paid_at")

  items            OrderItem[]
  paymentTransactions PaymentTransaction[]

  isActive         Boolean     @default(true) @map("is_active")
  isDeleted        Boolean     @default(false) @map("is_deleted")
  deletedAt        DateTime?   @map("deleted_at")
  createdAt        DateTime    @default(now()) @map("created_at")
  updatedAt        DateTime    @updatedAt @map("updated_at")
  version          Int         @default(0)
  metadata         Json?

  @@index([orderCode])
  @@index([userId])
  @@index([status])
  @@map("order")
}
```

### Payment Transaction Table

```prisma
model PaymentTransaction {
  id              String   @id @default(cuid())
  orderId         String   @map("order_id")
  userId          String   @map("user_id")
  amount          Decimal  @db.Decimal(10, 2)
  provider        String   @db.VarChar(50)
  orderCode       Int      @unique @map("order_code")
  paymentLinkId   String?  @map("payment_link_id")
  status          PaymentTransactionStatus
  checkoutUrl     String?  @map("checkout_url")
  qrCode          String?  @map("qr_code")
  paidAt          DateTime? @map("paid_at")

  order           Order    @relation(fields: [orderId], references: [id])

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@index([orderCode])
  @@index([orderId])
  @@map("payment_transaction")
}
```

### Enums

```prisma
enum OrderStatus {
  PENDING_PAYMENT
  PAID
  CONFIRMED
  SHIPPING
  DELIVERED
  CANCELED
  EXPIRED
}

enum PaymentMethod {
  CREDIT
  COD
}

enum PaymentTransactionStatus {
  PENDING
  PAID
  FAILED
  CANCELED
  EXPIRED
}
```

---

## 🧪 Testing Scenarios

### User Flow Testing

**1. COD Order Flow**

```bash
# Create COD order
POST /api/v1/orders/confirm
{
  "items": [...],
  "paymentMethod": "COD",
  "shippingAddressId": "addr123"
}

# Verify: Order status = CONFIRMED
# Verify: Cart items cleared
# Verify: Notification sent
```

**2. CREDIT Order Flow**

```bash
# Create CREDIT order
POST /api/v1/orders/confirm
{
  "items": [...],
  "paymentMethod": "CREDIT",
  "shippingAddressId": "addr123"
}

# Verify: Order status = PENDING_PAYMENT
# Verify: Payment link returned
# Verify: Cart items NOT cleared yet

# Simulate PayOS webhook
POST /webhooks/payos
{
  "data": {
    "orderCode": 123456789012,
    "amount": 150000
  },
  "signature": "..."
}

# Verify: Order status = PAID
# Verify: Cart items cleared
# Verify: Notification sent
```

**3. Payment Retry**

```bash
# Retry payment
POST /api/v1/orders/:orderId/retry-payment

# Verify: New payment link generated
# Verify: Old transaction expired
# Verify: New transaction created
```

### Admin Flow Testing

**1. View Orders**

```bash
# Get all orders
GET /api/v1/admin/order?page=1&limit=20

# Filter by status
GET /api/v1/admin/order?orderStatus=PAID

# Search
GET /api/v1/admin/order?search=john@example.com
```

**2. Update Order Status**

```bash
# Ship order
PATCH /api/v1/admin/order/:id/status
{
  "status": "SHIPPING"
}

# Verify: Status updated
# Verify: User notified

# Mark delivered
PATCH /api/v1/admin/order/:id/status
{
  "status": "DELIVERED"
}

# Verify: Status updated
# Verify: User notified
```

### Security Testing

**1. Webhook Signature Verification**

```bash
# Invalid signature
POST /webhooks/payos
{
  "data": {...},
  "signature": "invalid_signature"
}

# Verify: 400 error
# Verify: Payment NOT processed
```

**2. Order Ownership**

```bash
# User A tries to access User B's order
GET /api/v1/orders/:userB_orderId
Authorization: Bearer <userA_token>

# Verify: 403 Forbidden
```

---

## 🚀 Deployment Checklist

### Environment Variables

```env
# PayOS Configuration
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key

# Webhook URL (must be HTTPS)
PAYOS_WEBHOOK_URL=https://api.ventidole.com/webhooks/payos

# Deep Link URLs
PAYMENT_SUCCESS_URL=ventidole://payment/success
PAYMENT_FAILURE_URL=ventidole://payment/failure

# Notification Services
KNOCK_API_KEY=your_knock_api_key
GETSTREAM_API_KEY=your_getstream_key
```

### Webhook Setup

1. **Configure PayOS Webhook URL**
   - Login to PayOS dashboard
   - Set webhook URL: `https://your-domain.com/webhooks/payos`
   - Must be HTTPS
   - Must respond within 5 seconds

2. **Verify Webhook Endpoint**
   - Test signature verification
   - Test idempotency
   - Monitor response times

3. **Setup Monitoring**
   - Log all webhook requests
   - Alert on signature failures
   - Track processing times

### Database Migration

```bash
# Push schema changes
npx prisma db push

# Generate Prisma client
npx prisma generate

# Verify indexes created
# - orderCode (unique)
# - userId, status
```

### Notification Services

1. **Knock Workflows**
   - Configure email templates
   - Configure SMS templates
   - Configure push notification templates
   - Test all workflows

2. **GetStream**
   - Setup notification feed
   - Configure event types
   - Test real-time updates

---

## 📚 API Reference Summary

### User Endpoints

| Method | Endpoint                           | Description       | Auth     |
| ------ | ---------------------------------- | ----------------- | -------- |
| POST   | `/api/v1/orders/confirm`           | Create order      | Required |
| POST   | `/api/v1/orders/:id/retry-payment` | Retry payment     | Required |
| GET    | `/api/v1/orders/:id`               | Get order status  | Required |
| GET    | `/api/v1/orders`                   | Get user orders   | Required |
| GET    | `/api/v1/orders/:id/details`       | Get order details | Required |

### Admin Endpoints

| Method | Endpoint                         | Description       | Auth  |
| ------ | -------------------------------- | ----------------- | ----- |
| GET    | `/api/v1/admin/order`            | Get all orders    | Admin |
| GET    | `/api/v1/admin/order/:id`        | Get order details | Admin |
| POST   | `/api/v1/admin/order`            | Create order      | Admin |
| PATCH  | `/api/v1/admin/order/:id`        | Update order      | Admin |
| PATCH  | `/api/v1/admin/order/:id/status` | Change status     | Admin |
| DELETE | `/api/v1/admin/order/:id`        | Delete order      | Admin |

### Webhook Endpoints

| Method | Endpoint          | Description           | Auth               |
| ------ | ----------------- | --------------------- | ------------------ |
| POST   | `/webhooks/payos` | PayOS payment webhook | Public (Signature) |

---

## 🎯 Key Takeaways

### For Frontend Developers (React Native)

1. **CREDIT Payment:** Show QR code/checkout URL, PayOS redirects to deep link after payment
2. **Deep Link Handling:** Implement handlers for:
   - `ventidole://payment/success/:orderId` - Navigate to order confirmation screen
   - `ventidole://payment/failure/:orderId` - Navigate to payment failed screen with retry option
3. **COD Payment:** Order confirmed immediately, navigate to order confirmation
4. **Payment Retry:** Available for PENDING_PAYMENT orders via retry endpoint
5. **Real-time Updates:** Subscribe to GetStream for instant order status notifications

### For Backend Developers

1. **Webhook Idempotency:** Always check if order already PAID
2. **Signature Verification:** Verify all PayOS webhooks
3. **Cart Clearing:** COD immediate, CREDIT after payment
4. **Error Handling:** Don't fail payment if notification fails
5. **Logging:** Log all critical operations with metadata

### For Administrators

1. **Order Management:** Full CRUD on orders
2. **Status Control:** Change order status with automated notifications
3. **Advanced Filtering:** Search and filter by multiple criteria
4. **Audit Trail:** All changes logged with timestamps
5. **User Context:** See full user details with each order

---

**Last Updated:** January 7, 2026  
**Version:** 1.0.0
