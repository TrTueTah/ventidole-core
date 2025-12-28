# Ventidole Backend Architecture Documentation

> Comprehensive overview of the Ventidole Core backend system architecture, technologies, and design patterns.

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Domain-Driven Design](#domain-driven-design)
5. [Database Architecture](#database-architecture)
6. [Application Bootstrap & Configuration](#application-bootstrap--configuration)
7. [Core Infrastructure](#core-infrastructure)
8. [External Service Integrations](#external-service-integrations)
9. [Authentication & Authorization](#authentication--authorization)
10. [API Documentation](#api-documentation)
11. [Request Lifecycle](#request-lifecycle)
12. [Development Patterns](#development-patterns)

---

## Overview

Ventidole Core is an enterprise-grade NestJS backend application designed for a social commerce platform connecting fans with idols and communities. The architecture follows Domain-Driven Design (DDD) principles with clean separation of concerns, comprehensive type safety, and extensive third-party integrations.

**Key Characteristics:**
- Domain-Driven Design with bounded contexts
- RESTful API with OpenAPI documentation
- Multi-database architecture (PostgreSQL + Firebase)
- Real-time notifications and chat
- Payment processing and e-commerce
- Role-based access control
- Comprehensive error handling

---

## Technology Stack

### Core Framework
- **NestJS 11.x** - Progressive Node.js framework
- **Node.js** - JavaScript runtime
- **TypeScript 5.7** - Type-safe development

### Database & ORM
- **PostgreSQL** - Primary relational database (Neon serverless)
- **Prisma 6.16** - Next-generation ORM
- **Firebase Firestore** - NoSQL for real-time data
- **Redis** - Caching and session management

### Authentication & Security
- **Passport JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **class-validator** - DTO validation

### External Services
- **Stream Chat** - Real-time messaging
- **Knock** - Multi-channel notifications
- **PayOS** - Payment gateway
- **Firebase Admin** - Cloud services
- **OpenAI** - AI features

### Background Jobs & Queues
- **BullMQ** - Job queue processing
- **ioredis** - Redis client

### Developer Tools
- **Swagger/OpenAPI** - API documentation
- **Winston** - Structured logging
- **Jest** - Testing framework
- **ESLint + Prettier** - Code quality

---

## Project Structure

```
ventidole-core/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── core/                  # Core infrastructure
│   │   ├── config/            # Configuration files
│   │   ├── decorator/         # Custom decorators
│   │   ├── exception/         # Exception filters
│   │   ├── guard/             # Authentication guards
│   │   ├── interceptor/       # HTTP interceptors
│   │   └── pipe/              # Validation pipes
│   ├── db/                    # Database layer
│   │   ├── prisma/            # Generated Prisma client
│   │   └── firebase/          # Firebase integration
│   ├── domain/                # Business domains (DDD)
│   │   ├── admin/             # Admin domain
│   │   ├── user/              # User domain
│   │   ├── auth/              # Authentication
│   │   ├── order/             # Order processing
│   │   ├── file/              # File management
│   │   ├── knock/             # Notifications
│   │   └── stream-chat/       # Real-time chat
│   ├── shared/                # Shared resources
│   │   ├── constant/          # Constants & messages
│   │   ├── dto/               # Common DTOs
│   │   ├── enum/              # Enumerations
│   │   ├── helper/            # Utility functions
│   │   ├── interface/         # TypeScript interfaces
│   │   └── service/           # Shared services
│   ├── scripts/               # Utility scripts
│   ├── types/                 # Type definitions
│   ├── main.ts                # Application entry point
│   └── app.module.ts          # Root module
├── scripts/                   # External scripts
│   ├── seed-mock-data.ts      # Database seeding
│   ├── seed-posts.ts          # Post seeding
│   └── seed_all.py            # Bulk data generation
├── docs/                      # Documentation
├── openapi.yaml               # Generated API spec
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

---

## Domain-Driven Design

### Bounded Contexts

The application is organized into distinct domains with clear boundaries:

```
domain/
├── admin/                     # Administrative context
│   ├── user/                  # User management
│   ├── community/             # Community moderation
│   ├── shop/                  # Shop administration
│   ├── product/               # Product management
│   ├── order/                 # Order management
│   └── chat/                  # Chat moderation
│
├── user/                      # User context
│   ├── post/                  # Social posts
│   ├── comment/               # Comments
│   ├── community/             # Community participation
│   ├── chat/                  # User chat
│   ├── shop/                  # Shopping features
│   └── address/               # Address management
│
├── auth/                      # Authentication context
├── order/                     # Order processing context
├── file/                      # File management context
├── knock/                     # Notification context
└── stream-chat/               # Real-time chat context
```

### Domain Module Pattern

Each domain follows a consistent structure:

```
domain/[domain-name]/
├── [domain-name].module.ts     # NestJS module definition
├── [domain-name].controller.ts # HTTP endpoints (API layer)
├── [domain-name].service.ts    # Business logic
└── dto/                         # Data Transfer Objects
    ├── create-[entity].dto.ts
    ├── update-[entity].dto.ts
    ├── get-[entities].dto.ts
    └── [entity].dto.ts          # Response DTO
```

**Example: Admin User Domain** (`src/domain/admin/user/`)
- `admin-user.module.ts` - Dependency injection
- `admin-user.controller.ts` - REST endpoints
- `admin-user.service.ts` - Business logic
- `dto/` - Request/Response validation

### Module Hierarchy

```
AppModule (root)
├── ConfigModule (global)
├── Infrastructure Modules
│   ├── RedisModule
│   ├── QueueModule
│   ├── KnockWorkflowModule
│   └── PaymentGatewayModule
│
├── Domain Modules
│   ├── AuthModule
│   ├── FileModule
│   │
│   ├── UserModule (aggregate)
│   │   ├── PostModule
│   │   ├── CommentModule
│   │   ├── CommunityModule
│   │   ├── ChatModule
│   │   ├── ShopModule
│   │   └── AddressModule
│   │
│   ├── AdminModule (aggregate)
│   │   ├── AdminUserModule
│   │   ├── AdminCommunityModule
│   │   ├── AdminShopModule
│   │   ├── AdminProductModule
│   │   ├── AdminOrderModule
│   │   └── AdminChatModule
│   │
│   ├── OrderModule
│   ├── StreamChatModule
│   └── KnockModule
```

---

## Database Architecture

### Prisma Configuration

**Location:** `prisma/schema.prisma`

**Generator Settings:**
```prisma
generator client {
  provider      = "prisma-client"
  output        = "../src/db/prisma"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

**Datasource:**
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      # Pooled connection
  directUrl = env("DIRECT_URL")        # Direct connection for migrations
}
```

**Database Provider:** Neon PostgreSQL (serverless)
- **DATABASE_URL**: Connection pooling endpoint for application queries
- **DIRECT_URL**: Direct connection for schema migrations

### Data Models (24 total)

#### Authentication & Users
- **User** - Main user model with roles (FAN, ADMIN, IDOL)
- **Verification** - Email/password verification tokens
- **SocialAccount** - OAuth providers (Google, Facebook)

#### Social Features
- **Community** - Fan communities (SOLO/GROUP types)
- **CommunityFollower** - User-community relationships
- **Post** - Social posts with engagement counters
- **Comment** - Nested comments (self-referential)
- **PostLike** - Like tracking
- **PostView** - View tracking

#### Chat System
- **ChatChannel** - Communication channels
- **ChatParticipant** - User-channel relationships with roles
- **ChatMessage** - Message content

#### E-commerce
- **Shop** - Community shops
- **ProductType** - Product categories
- **Product** - Products with variants
- **ProductVariant** - Size/color/price variants
- **Cart** - User shopping carts
- **CartItem** - Cart line items
- **Order** - Orders with status tracking
- **OrderItem** - Order line items
- **PaymentTransaction** - Payment records

#### Location
- **Province** - Vietnamese provinces
- **District** - Districts within provinces
- **Address** - User shipping addresses

### Database Patterns

#### 1. Soft Delete Pattern
All models support logical deletion:
```prisma
isDeleted  Boolean   @default(false) @map("is_deleted")
deletedAt  DateTime? @map("deleted_at")
```

#### 2. Audit Trail
Complete change tracking:
```prisma
isActive   Boolean   @default(true)
createdAt  DateTime  @default(now())
updatedAt  DateTime  @updatedAt
version    Int       @default(0)
metadata   Json?
```

#### 3. Denormalized Counters
Performance optimization for common queries:
- `Post.likeCount`, `Post.commentCount`, `Post.viewCount`
- `ChatChannel.memberCount`
- User engagement metrics

#### 4. Cascade Behavior
- Most foreign keys: `onDelete: Cascade` (automatic cleanup)
- Address references: `onDelete: Restrict` (prevent data loss)

### Prisma Client Integration

**Generated Location:** `src/db/prisma/`

**Generated Files:**
- `client.ts` - Main PrismaClient export
- `enums.ts` - TypeScript enums (Role, OrderStatus, PaymentMethod, etc.)
- `models/` - Individual model type definitions
- `internal/` - Internal Prisma runtime

**NestJS Service:** `src/shared/service/prisma/prisma.service.ts`
```typescript
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Global Module:** `src/shared/service/prisma/prisma.module.ts`
```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### Migration Strategy

- **Development:** `prisma db push` for rapid iteration
- **Production:** Direct schema application to Neon PostgreSQL
- **Commands:**
  - `npm run db:push` - Apply schema changes
  - `npm run db:drop` - Reset database
  - `npm run postinstall` - Generate Prisma client

### Seeding Strategy

#### 1. TypeScript Mock Data (`scripts/seed-mock-data.ts`)
- Seeds PostgreSQL + GetStream Chat
- Creates: Users, Communities, Chat channels, Shops, Products, Carts
- Stream Chat integration with rate limiting
- Command: `npm run seed:mock`

#### 2. Python Bulk Seeding (`scripts/seed_all.py`)
- Generates large test datasets (500+ users)
- Creates: Communities, Idols, Fans, Posts, Interactions
- Uses `psycopg2` with batch inserts for performance
- Configurable parameters (post count, follow rate, etc.)

#### 3. Post Seeding (`scripts/seed-posts.ts`)
- Seeds Firebase Firestore with posts
- Creates realistic engagement metrics
- Command: `npm run seed:posts`

#### 4. Location Sync (`scripts/sync-provinces-districts.ts`)
- Syncs Vietnamese province/district data
- Command: `npm run sync:provinces`

---

## Application Bootstrap & Configuration

### Entry Point (`src/main.ts`)

**Bootstrap Sequence:**

1. **Logger Configuration**
   - Winston logger for structured logging
   - HTTP request/response logging

2. **Security Middleware**
   ```typescript
   - Helmet (CSP, security headers)
   - CORS (configurable origins)
   - Cookie parser (with secret)
   - Body parser (1MB limit)
   - Compression
   ```

3. **Global Pipes**
   - `CustomValidationPipe` - DTO validation with class-validator

4. **Global Filters**
   - `UnhandledExceptionFilter` - Centralized error handling

5. **Global Interceptors**
   - `HttpLoggerInterceptor` - Request/response logging

6. **Global Guards**
   - `JwtAuthGuard` - Authentication and authorization

7. **API Versioning**
   - Type: URI-based versioning (`/v1/...`)

8. **OpenAPI Documentation**
   - Swagger UI at `/docs`
   - Export to `openapi.yaml`

### Root Module (`src/app.module.ts`)

```typescript
@Module({
  imports: [
    ConfigModule.forRoot(initEnvironmentConfig()),
    RedisModule,
    QueueModule,
    KnockWorkflowModule,
    PaymentGatewayModule,
    AuthModule,
    FileModule,
    UserModule,
    AdminModule,
    OrderModule,
    StreamChatModule,
    KnockModule,
  ],
})
export class AppModule {}
```

### Environment Configuration

**Location:** `src/core/config/env.config.ts`

**Features:**
- Type-safe environment variables
- Validation on startup using `class-validator`
- Auto-transformation (string → number, boolean)
- Global access via `ENVIRONMENT` object

**Key Environment Variables:**
```bash
# Server
PORT=3000
NODE_ENV=development
CORS=http://localhost:3000
CORS_CREDENTIALS=true

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Authentication
JWT_SECRET=...
JWT_SENSITIVE_SECRET=...
JWT_EXPIRED=86400

# Redis
REDIS_HOST=...
REDIS_PORT=6379
REDIS_PASSWORD=...

# Payment
PAYOS_API_KEY=...
PAYOS_CLIENT_ID=...
PAYOS_CHECKSUM_KEY=...

# Notifications
KNOCK_SECRET_KEY=...
STREAM_CHAT_API_KEY=...
STREAM_CHAT_SECRET=...

# Firebase
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# Email
MAIL_HOST=...
MAIL_PORT=587
MAIL_USER=...
MAIL_PASSWORD=...
```

---

## Core Infrastructure

### Guards (`src/core/guard/`)

#### JwtAuthGuard (`jwt-auth.guard.ts`)

**Purpose:** Authentication and authorization

**Flow:**
1. Check if route is marked `@Public()` → skip if true
2. Validate JWT token from request header
3. Extract user from token and validate against database
4. Check required roles via `@Roles()` decorator
5. Allow if authenticated (no specific role required) or has required role

**Features:**
- Token expiration handling
- Role-based access control (RBAC)
- Public route support
- User validation

**Usage:**
```typescript
// Public route (bypass authentication)
@Public()
@Post('sign-in')

// Role-based authorization
@Roles(Role.ADMIN)
@Get('admin/users')
```

### Interceptors (`src/core/interceptor/`)

#### HttpLoggerInterceptor (`http-logger.interceptor.ts`)

**Purpose:** HTTP request/response logging

**Features:**
- Logs all HTTP requests in development
- Color-coded by HTTP method
- Tracks request duration
- Logs request body, query params, path params
- Performance monitoring

### Pipes (`src/core/pipe/`)

#### CustomValidationPipe (`validation.pipe.ts`)

**Purpose:** Automatic DTO validation

**Features:**
- Uses `class-validator` decorators
- Whitelist mode (removes unexpected fields)
- Transform mode (auto-converts data types)
- Custom error formatting with error codes

### Exception Filters (`src/core/exception/`)

#### UnhandledExceptionFilter (`exception.filter.ts`)

**Purpose:** Global error handling

**Features:**
- Catches all exceptions globally
- Standardized error response format
- Maps exceptions to error codes
- Winston logging integration
- Supports custom error codes

**Error Response Format:**
```typescript
{
  statusCode: number,
  message: string,
  data: null,
  error: string,
  errorCode: ErrorCode
}
```

**Error Handling Hierarchy:**
1. `CustomError` → Business logic errors
2. `HttpException` → HTTP-specific errors
3. `CustomHttpException` → Custom error codes with i18n
4. Unknown errors → Generic error response

### Decorators (`src/core/decorator/`)

1. **@Public()** - Marks routes as publicly accessible
2. **@Roles(Role[])** - Role-based access control
3. **@ApiResponseCustom()** - Swagger documentation helpers
4. **@ApiPaginationResponse()** - Pagination documentation

---

## External Service Integrations

### 1. Authentication (JWT)

**Service:** `src/shared/service/token/token.service.ts`
**Strategy:** `src/shared/service/token/jwt.strategy.ts`

**Features:**
- Access tokens (configurable expiration)
- Refresh tokens (MD5-based secret rotation)
- Sensitive tokens (critical operations)
- Redis caching for user sessions
- Token issuers: Access, Sensitive, Refresh

**Environment Variables:**
```
JWT_SECRET
JWT_SENSITIVE_SECRET
JWT_EXPIRED
```

### 2. Payment Processing (PayOS)

**Service:** `src/shared/service/payment-gateway/payos.service.ts`
**Provider:** PayOS (Vietnamese payment gateway)
**Base URL:** https://api-merchant.payos.vn/v2

**Features:**
- QR code payment generation
- Credit card payment links
- HMAC SHA256 webhook signature verification
- Payment request creation
- Automatic webhook processing

**Integration Points:**
- Order creation: Creates payment link
- Webhook handler: `src/domain/order/webhook.controller.ts`
- Real-time confirmation via GetStream

**Environment Variables:**
```
PAYOS_API_KEY
PAYOS_CLIENT_ID
PAYOS_CHECKSUM_KEY
FRONTEND_URL
```

### 3. Notifications (Knock)

**Service:** `src/shared/service/knock-workflow/knock-workflow.service.ts`
**SDK:** @knocklabs/node v1.24.0
**Config:** `src/core/config/knock.config.ts`

**Features:**
- Multi-channel delivery (Push, In-App, Email)
- Workflow-based notifications
- User registration and management
- Channel subscription management
- FCM token handling
- Client token generation

**Supported Workflows:**
- `COMMUNITY_NEW_POST` - New posts
- `CONFIRM_ORDER` - Order confirmation
- `POST_LIKED` - Post interactions
- `POST_COMMENTED` - Comment notifications
- `COMMUNITY_JOINED` - New members
- `NEW_MESSAGE` - Chat messages
- `CHANNEL_INVITATION` - Chat invites
- `CHANNEL_CREATED` - New channels
- `ORDER_SHIPPED` - Shipping updates
- `ORDER_DELIVERED` - Delivery confirmations
- `PAYMENT_SUCCESS` - Payment confirmations
- `PAYMENT_FAILED` - Payment failures

**Environment Variables:**
```
KNOCK_SECRET_KEY
KNOCK_SIGNING_KEY
KNOCK_PUSH_CHANNEL_ID
KNOCK_IN_APP_CHANNEL_ID
KNOCK_IN_APP_NOTIFICATION_WORKFLOW_KEY
```

### 4. Real-time Events (GetStream)

**Service:** `src/shared/service/getstream-notification/getstream-notification.service.ts`
**SDK:** stream-chat v9.26.0

**Purpose:** Real-time event streaming to client apps

**Features:**
- User-specific notification channels (`notifications-{userId}`)
- Real-time event emission
- Order status updates
- Post interaction events
- Community activity notifications

**Event Types:**
- `new_post` - New community posts
- `post_liked` - Post likes
- `post_commented` - Post comments
- `community_joined` - New members
- `new_message` - Chat messages
- `channel_invitation` - Channel invites
- `order_status_updated` - Order updates
- `invalidate_queries` - Client cache invalidation
- `navigate` - Client navigation triggers

**Environment Variables:**
```
STREAM_CHAT_API_KEY
STREAM_CHAT_SECRET
```

### 5. Chat & Messaging (Stream Chat)

**Service:** `src/domain/stream-chat/stream-chat.service.ts`
**SDK:** stream-chat v9.26.0

**Features:**
- User authentication token generation
- User management (create, update, delete)
- Channel creation and management
- Message sending
- Member management (add, remove)
- Channel querying
- Message history retrieval

**Channel Types:**
- `team` - Standard chat channels
- `messaging` - Direct messages

### 6. Storage (Firebase)

**Service:** `src/shared/service/firebase/firebase.service.ts`
**SDK:** firebase-admin v13.4.0

**Available Services:**
- Cloud Storage (file uploads)
- Firestore (NoSQL database)
- Realtime Database
- Authentication (token verification)
- Cloud Messaging (push notifications)

**Features:**
- Service account authentication
- Custom token generation
- ID token verification
- Push notification sending
- File storage management

**Storage Bucket:** `{PROJECT_ID}.firebasestorage.app`

**Environment Variables:**
```
FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY
FIREBASE_CLIENT_EMAIL
```

### 7. Recommendations (External ML API)

**Service:** `src/shared/service/recommendation/recommendation.service.ts`

**Features:**
- User-based recommendations
- Pagination support
- Health check endpoint
- Timeout: 10 seconds

**Endpoints:**
```
GET /recommendations/{userId}?limit=20&offset=0
GET /health
```

**Environment Variables:**
```
RECOMMENDATION_API_URL
```

### 8. Email (SMTP)

**Service:** `src/shared/service/mail/mail.service.ts`
**SDK:** @nestjs-modules/mailer v2.0.2
**Template Engine:** Handlebars

**Features:**
- OTP email sending
- Template-based emails
- Queue-based sending (BullMQ)

**Environment Variables:**
```
MAIL_HOST
MAIL_PORT
MAIL_USER
MAIL_PASSWORD
MAIL_FROM
```

### 9. Caching & Sessions (Redis)

**Service:** `src/shared/service/redis/redis.service.ts`
**SDK:** ioredis v5.5.0

**Features:**
- Session caching (user data)
- OTP storage with TTL
- Set operations for collections
- Pattern-based key retrieval
- Exponential backoff retry strategy

**Use Cases:**
- User session caching (JWT validation)
- OTP verification codes
- Rate limiting

**Environment Variables:**
```
REDIS_HOST
REDIS_PORT
REDIS_USER
REDIS_PASSWORD
```

### 10. Background Jobs (BullMQ)

**Service:** `src/shared/service/queue/queue.module.ts`
**SDK:** bullmq v5.41.7, @nestjs/bullmq v11.0.2

**Features:**
- Asynchronous email sending
- Background job processing
- Queue: "verification" for OTP emails

**Producers/Consumers:**
- VerificationProducer: Queues email jobs
- VerificationConsumer: Processes email jobs

### 11. OTP Verification

**Service:** `src/shared/service/otp/otp.service.ts`

**Features:**
- Configurable OTP length
- Rate limiting (per-day and per-request)
- Expiration tracking
- Development mode (0000 for local testing)
- Redis storage with TTL

**Environment Variables:**
```
OTP_LENGTH
OTP_LIMIT
OTP_DAY_LIMIT
OTP_EXPIRE_TIME
VERIFICATION_SESSION
```

---

## Authentication & Authorization

### Authentication Flow

1. **Sign In:**
   - User submits credentials
   - Backend validates email/password
   - JWT access token generated
   - Refresh token generated
   - Tokens stored in Redis for fast validation
   - Response includes tokens and user data

2. **Request Authentication:**
   - Client includes JWT in `Authorization: Bearer <token>` header
   - `JwtAuthGuard` intercepts request
   - Token validated and decoded
   - User object attached to `req.user`
   - Request proceeds to controller

3. **Token Refresh:**
   - Client submits refresh token
   - Backend validates refresh token
   - New access token generated
   - New refresh token generated
   - Old tokens invalidated

### Authorization (RBAC)

**Roles:**
- `ADMIN` - Administrative access
- `FAN` - Regular user
- `IDOL` - Content creator

**Implementation:**
```typescript
// Route-level authorization
@Roles(Role.ADMIN)
@Get('admin/users')
async getUsers() {
  // Only ADMIN role can access
}

// Public routes (no authentication required)
@Public()
@Post('sign-in')
async signIn() {
  // Anyone can access
}
```

**Guard Logic:**
1. Extract required roles from `@Roles()` decorator
2. Extract user roles from `req.user`
3. Check if user has at least one required role
4. Allow or deny access

---

## API Documentation

### OpenAPI/Swagger

**Configuration:** `src/core/config/doc.config.ts`
**SDK:** @nestjs/swagger v11.1.4
**Theme:** CLASSIC (swagger-themes)

**Features:**
- Auto-generated from NestJS decorators
- JWT Bearer authentication support
- Custom themed UI
- YAML export to `openapi.yaml`
- Live documentation at `/docs`
- Versioned API (v1)

**Setup:**
```typescript
setupSwagger(app);
// Creates /docs endpoint
// Exports to openapi.yaml
```

**DTO Documentation:**
```typescript
@ApiProperty({ description: 'User email', example: 'user@example.com' })
@IsEmail()
email: string;
```

---

## Request Lifecycle

Complete flow of an HTTP request through the application:

```
1. Client Request
   ↓
2. Middleware Layer
   - Helmet (security headers)
   - CORS validation
   - Body parser (JSON, 1MB limit)
   - Cookie parser
   - Compression
   ↓
3. Global Guard (JwtAuthGuard)
   - Check @Public() decorator
   - Validate JWT token
   - Load user from database
   - Check @Roles() requirements
   ↓
4. Interceptor (HttpLoggerInterceptor - Before)
   - Log request details
   - Start timer
   ↓
5. Pipe (CustomValidationPipe)
   - Validate DTO with class-validator
   - Transform data types
   - Whitelist properties
   ↓
6. Controller Method
   - Route handler executes
   - Calls service layer
   ↓
7. Service Layer
   - Business logic execution
   - Database operations via Prisma
   - External service calls
   ↓
8. Repository/Database
   - Prisma ORM queries
   - Transaction management
   ↓
9. Response Formation
   - Service returns data
   - Controller formats response
   ↓
10. Interceptor (HttpLoggerInterceptor - After)
    - Log response details
    - Log duration
    ↓
11. Exception Filter (if error occurs)
    - Catch unhandled exceptions
    - Format error response
    - Log error
    ↓
12. Client Response
    - Standardized JSON response
    - HTTP status code
```

**Standardized Response Format:**
```typescript
{
  statusCode: 200,
  message: "OK",
  data: {...},      // Success data or null
  error: null,      // Error message or null
  errorCode: null   // Error code or null
}
```

---

## Development Patterns

### 1. Dependency Injection

All services use constructor injection:
```typescript
@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentGateway: PayosService,
    private readonly knockWorkflow: KnockWorkflowService,
  ) {}
}
```

### 2. DTO Pattern

All inputs/outputs validated via DTOs:
```typescript
// Request DTO
export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  items: OrderItemDto[];

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

// Response DTO
export class OrderDto {
  id: string;
  orderCode: string;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItemDto[];
}
```

### 3. Repository Pattern

Services encapsulate database access:
```typescript
@Injectable()
export class OrderService {
  async createOrder(userId: string, dto: CreateOrderDto) {
    return this.prisma.order.create({
      data: {
        userId,
        orderCode: this.generateOrderCode(),
        totalAmount: this.calculateTotal(dto.items),
        items: { create: dto.items },
      },
      include: { items: true },
    });
  }
}
```

### 4. Error Handling

Consistent error handling with custom exceptions:
```typescript
if (!user) {
  throw new CustomHttpException(ErrorCode.UserNotFound);
}
```

### 5. Configuration Management

Type-safe configuration:
```typescript
import { ENVIRONMENT } from '@core/config/env.config';

const port = ENVIRONMENT.PORT;
const jwtSecret = ENVIRONMENT.JWT_SECRET;
```

### 6. Logging

Structured logging with Winston:
```typescript
WinstonLogger.info('Order created', {
  orderId,
  userId,
  amount
});
```

### 7. Separation of Concerns

- **Controllers:** HTTP layer only (routing, request/response)
- **Services:** Business logic
- **Repositories:** Data access (via Prisma)
- **DTOs:** Data validation and transformation
- **Modules:** Dependency management

---

## Integration Architecture Flows

### Payment Flow

```
1. User creates order (CREDIT payment method)
   ↓
2. OrderService.createOrder()
   - Create order record (status: PENDING)
   - Generate unique order code
   ↓
3. PayosService.createPaymentLink()
   - Generate QR code
   - Create payment URL
   - Sign request with HMAC SHA256
   ↓
4. Return payment link to user
   ↓
5. User completes payment on PayOS
   ↓
6. PayOS webhook → webhook.controller.ts
   - Verify HMAC signature
   - Validate payment data
   ↓
7. OrderService.updateOrderStatus()
   - Update order status: PAID
   - Create PaymentTransaction record
   ↓
8. GetStreamNotificationService.emitEvent()
   - Emit 'order_status_updated' event
   - Real-time update to client
   ↓
9. KnockWorkflowService.triggerWorkflow()
   - Send PAYMENT_SUCCESS notification
   - Multi-channel delivery (Push, In-App, Email)
```

### Notification Flow

```
1. Event occurs (order, post, comment, etc.)
   ↓
2. Service triggers notification
   ↓
3. KnockWorkflowService.triggerWorkflow()
   - Select workflow based on event type
   - Identify recipient(s)
   - Prepare notification data
   ↓
4. Knock API processes workflow
   - Route to channels (Push, In-App, Email)
   - Apply delivery preferences
   - Track delivery status
   ↓
5. GetStreamNotificationService.emitEvent() (parallel)
   - Emit real-time event to user's channel
   - Client receives instant update
   ↓
6. User receives notification
   - Mobile: Push notification
   - Web: In-app notification
   - Email: Email notification
```

### Chat Flow

```
1. User authenticates
   ↓
2. StreamChatService.generateUserToken()
   - Create Stream Chat token
   - Return to client
   ↓
3. Client connects to Stream Chat SDK
   ↓
4. User sends message
   ↓
5. Stream Chat processes message
   - Store message
   - Deliver to channel members
   - Trigger webhook (optional)
   ↓
6. Backend webhook (optional)
   - KnockWorkflowService.triggerWorkflow()
   - Send NEW_MESSAGE notification
   ↓
7. Recipients receive message
   - Real-time via Stream Chat SDK
   - Push notification via Knock
```

---

## Performance Optimizations

1. **Connection Pooling**
   - Neon PostgreSQL connection pooling
   - Redis connection pooling

2. **Denormalized Counters**
   - Post likes, comments, views cached in database
   - Reduces join queries

3. **Redis Caching**
   - User sessions cached
   - OTP codes cached with TTL
   - Reduces database queries

4. **Background Jobs**
   - Email sending via BullMQ
   - Asynchronous processing

5. **Response Compression**
   - GZIP compression middleware
   - Reduces bandwidth

6. **Database Indexes**
   - Prisma auto-indexes on foreign keys
   - Custom indexes on frequently queried fields

---

## Security Features

1. **Authentication**
   - JWT-based with refresh tokens
   - Token expiration
   - Redis session management

2. **Authorization**
   - Role-based access control (RBAC)
   - Route-level guards

3. **Password Security**
   - bcryptjs hashing (10 salt rounds)
   - No plaintext storage

4. **Request Validation**
   - DTO validation with class-validator
   - Whitelist mode (strip unknown properties)

5. **Security Headers**
   - Helmet middleware
   - Content Security Policy
   - CORS configuration

6. **Rate Limiting**
   - OTP request limiting
   - Configurable limits per user

7. **Webhook Verification**
   - HMAC signature validation (PayOS)
   - Prevents tampering

8. **Input Sanitization**
   - Automatic via class-validator
   - SQL injection prevention via Prisma ORM

---

## Deployment Considerations

### Environment Variables

Create `.env` file with all required variables:
- Database credentials (DATABASE_URL, DIRECT_URL)
- JWT secrets
- External service API keys
- Redis credentials
- Email SMTP settings

### Database Migration

```bash
# Development
npm run db:push

# Production
# Apply schema directly or use migration files
prisma migrate deploy
```

### Building

```bash
npm run build
# Generates dist/ folder
```

### Starting

```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

### Seeding

```bash
# Seed mock data
npm run seed:mock

# Seed posts
npm run seed:posts

# Sync provinces
npm run sync:provinces
```

### Health Checks

- **API Health:** `GET /health` (if implemented)
- **Recommendation Service:** `GET {RECOMMENDATION_API_URL}/health`

---

## Summary

The Ventidole backend is a **production-ready**, **scalable**, and **maintainable** NestJS application featuring:

- ✅ Domain-Driven Design with clear bounded contexts
- ✅ Comprehensive type safety with TypeScript
- ✅ Multi-database architecture (PostgreSQL + Firebase)
- ✅ Real-time capabilities (Stream Chat + GetStream)
- ✅ Payment processing (PayOS)
- ✅ Multi-channel notifications (Knock)
- ✅ Role-based access control
- ✅ Comprehensive error handling
- ✅ Structured logging
- ✅ API documentation (OpenAPI/Swagger)
- ✅ Background job processing
- ✅ Security best practices
- ✅ Modular and testable code

**Architecture Strengths:**
- Clean separation of concerns
- Dependency injection throughout
- Standardized response format
- Extensive third-party integrations
- Performance optimizations
- Developer-friendly with TypeScript
- Comprehensive documentation

This architecture supports rapid feature development while maintaining code quality, security, and scalability.

---

**Generated:** 2025-12-28
**Version:** 0.0.1
**Framework:** NestJS 11.x
