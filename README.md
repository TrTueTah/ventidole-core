# Ventidole Core API

> A robust and scalable NestJS backend application with Firebase integration, Redis caching, PostgreSQL database, and comprehensive file management.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Architecture](#architecture)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Documentation](#documentation)
- [License](#license)

## 🎯 Overview

Ventidole Core is a production-ready NestJS backend application designed for scalability and maintainability. It implements a clean architecture pattern with domain-driven design principles, featuring authentication, authorization, file management, email services, and real-time capabilities.

**Key Highlights:**
- ✅ RESTful API with versioning support (v1)
- ✅ JWT-based authentication with refresh tokens
- ✅ Firebase Storage integration for file management
- ✅ Redis caching and queue management with BullMQ
- ✅ PostgreSQL database with Prisma ORM
- ✅ Email service with template support
- ✅ Comprehensive error handling and logging
- ✅ OpenAPI/Swagger documentation
- ✅ Role-based access control (RBAC)
- ✅ Docker support for development and production

## 🛠 Tech Stack

### Core Framework
- **NestJS 11** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Node.js** - Runtime environment

### Database & ORM
- **PostgreSQL** - Primary database
- **Prisma 6** - Next-generation ORM
- **Redis (ioredis)** - Caching and session management

### Authentication & Security
- **Passport JWT** - JWT authentication strategy
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **Cookie Parser** - Cookie handling

### Cloud Services
- **Firebase Admin SDK** - Firebase Storage integration
- **Google Auth Library** - Google authentication

### Queue & Jobs
- **BullMQ** - Redis-based queue management
- **@nestjs/bullmq** - NestJS integration

### Email
- **@nestjs-modules/mailer** - Email service
- **Nodemailer** - Email transport
- **EJS** - Email template engine

### API Documentation
- **Swagger** - OpenAPI specification
- **@nestjs/swagger** - NestJS integration

### Utilities
- **class-validator** - Request validation
- **class-transformer** - Object transformation
- **dayjs** - Date manipulation
- **winston** - Logging
- **compression** - Response compression
- **axios** - HTTP client

### Development Tools
- **@swc/core** - Fast TypeScript compiler
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework

## ✨ Features

### Authentication & Authorization
- User registration and login
- Email verification system
- Password reset flow
- JWT access and refresh tokens
- Role-based access control (FAN, IDOL, ADMIN)
- Social authentication support (Google, Facebook)

### File Management
- Upload single/multiple files to Firebase Storage
- Delete files and folders
- Generate signed URLs for temporary access
- Get file metadata and listings
- File existence checking
- Support for various file types (images, documents, videos, audio)
- Organized folder structure (profiles, posts, attachments, documents, thumbnails, temp)

### User Management
- User profile management
- Online status tracking
- Account activation/deactivation
- Social account linking

### Email Services
- Template-based email system
- Verification emails
- Password reset emails
- Welcome emails
- Queue-based email sending

### Post Management
- Create and manage posts
- User-post relationships
- Post data operations

### Infrastructure
- Comprehensive error handling
- Request/Response logging
- Global validation pipes
- Custom decorators for API documentation
- Health checks and monitoring
- Rate limiting support

## 📁 Project Structure

```
ventidole-core/
├── docker/                      # Docker configurations
│   ├── dev/                    # Development environment
│   ├── local/                  # Local development
│   ├── prod/                   # Production environment
│   └── db/                     # Database initialization
├── docs/                       # Documentation
│   ├── DATABASE_DESIGN_GUIDE.md
│   ├── FIREBASE_QUICK_START.md
│   ├── FILE_SERVICE_GUIDE.md
│   └── ...
├── packages/                   # Package modules
│   └── ventidole-api/         # API client package
├── prisma/                     # Database schema and migrations
│   ├── schema.prisma          # Prisma schema
│   └── migrations/            # Database migrations
├── src/
│   ├── core/                  # Core functionality
│   │   ├── config/           # Configuration files
│   │   ├── decorator/        # Custom decorators
│   │   ├── exception/        # Exception filters
│   │   ├── guard/            # Auth guards
│   │   ├── interceptor/      # HTTP interceptors
│   │   └── pipe/             # Validation pipes
│   ├── db/                    # Database clients
│   │   ├── prisma/           # Generated Prisma client
│   │   └── firebase/         # Firebase configuration
│   ├── domain/                # Business logic domains
│   │   ├── auth/             # Authentication module
│   │   ├── user/             # User management module
│   │   ├── post/             # Post management module
│   │   └── file/             # File management module
│   ├── shared/                # Shared utilities
│   │   ├── constant/         # Constants
│   │   ├── enum/             # Enumerations
│   │   ├── helper/           # Helper functions
│   │   ├── interface/        # TypeScript interfaces
│   │   └── service/          # Shared services
│   │       ├── firebase/     # Firebase service
│   │       ├── logger/       # Winston logger
│   │       ├── mail/         # Email service
│   │       ├── otp/          # OTP service
│   │       ├── redis/        # Redis service
│   │       └── token/        # Token service
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry point
├── test/                       # Test files
├── .env                        # Environment variables (not in repo)
├── nest-cli.json              # NestJS CLI configuration
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript configuration
└── openapi.yaml               # Generated OpenAPI spec
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.x
- **Yarn** >= 1.22.x
- **PostgreSQL** >= 14.x
- **Redis** >= 6.x
- **Docker** (optional, for containerized development)

## 🚀 Installation

1. **Clone the repository**
```bash
git clone https://github.com/TrTueTah/ventidole-core.git
cd ventidole-core
```

2. **Install dependencies**
```bash
yarn install
```

3. **Generate Prisma Client**
```bash
yarn prisma generate
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application
NODE_ENV=development
PORT=8080
API_PREFIX=api

# CORS
CORS=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ventidole?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/ventidole?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USER=default
REDIS_PASSWORD=your-redis-password

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Cookie
COOKIE_SECRET=your-cookie-secret

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Email (Mailer)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@ventidole.com

# Application URLs
APP_URL=http://localhost:8080
CLIENT_URL=http://localhost:3000
```

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Generate a service account key
3. Add the credentials to your `.env` file
4. Enable Firebase Storage in your project

Refer to `docs/FIREBASE_QUICK_START.md` for detailed setup instructions.

## 🏃 Running the Application

### Development Mode
```bash
yarn start:dev
```
The server will start at `http://localhost:8080` with hot-reload enabled.

### Production Mode
```bash
# Build the application
yarn build

# Start production server
yarn start:prod
```

### Docker Development
```bash
# Start all services (app, database, redis)
cd docker/dev
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Local Docker
```bash
cd docker/local
docker-compose up -d
```

## 📚 API Documentation

### Swagger UI
Once the application is running, access the interactive API documentation at:

```
http://localhost:8080/api-docs
```

### OpenAPI Spec
The OpenAPI specification is automatically generated at `openapi.yaml` in the root directory.

### API Versioning
All endpoints are versioned with URI versioning:
```
/v1/auth/sign-in
/v1/user/update-status
/v1/file/upload
/v1/post
```

### Main Endpoints

#### Authentication
- `POST /v1/auth/sign-in` - User login
- `POST /v1/auth/sign-up` - User registration
- `POST /v1/auth/send-verification` - Send verification code
- `POST /v1/auth/confirm-verification` - Confirm verification
- `POST /v1/auth/refresh-token` - Refresh access token
- `POST /v1/auth/reset-password` - Reset password

#### User
- `POST /v1/user/update-status` - Update user online status

#### File
- `POST /v1/file/upload` - Upload single file
- `POST /v1/file/upload-multiple` - Upload multiple files
- `DELETE /v1/file/delete` - Delete file
- `GET /v1/file/url` - Get file URL
- `GET /v1/file/signed-url` - Get signed URL
- `GET /v1/file/exists` - Check file existence
- `GET /v1/file/metadata` - Get file metadata
- `GET /v1/file/list` - List files in folder
- `DELETE /v1/file/folder` - Delete folder

#### Post
- `POST /v1/post` - Create post

## 🗄️ Database

### Prisma Schema

The database schema includes:
- **Account** - User accounts with authentication
- **Verification** - Email/phone verification tokens
- **SocialAccount** - Social authentication providers

### Roles
- `FAN` - Regular user
- `IDOL` - Content creator
- `ADMIN` - Administrator

### Migrations

```bash
# Create a new migration
yarn prisma migrate dev --name migration_name

# Apply migrations
yarn prisma migrate deploy

# Reset database
yarn prisma migrate reset

# Open Prisma Studio
yarn prisma studio
```

## 🏗️ Architecture

### Design Patterns
- **Modular Architecture** - Domain-driven design with feature modules
- **Dependency Injection** - NestJS built-in DI container
- **Repository Pattern** - Data access abstraction with Prisma
- **Factory Pattern** - Service and provider factories
- **Decorator Pattern** - Custom decorators for metadata

### Code Style
- **BaseResponse Wrapper** - Consistent API response structure
- **CustomError** - Centralized error handling with error codes
- **Request/Response DTOs** - Type-safe API contracts
- **Enum-based Constants** - Type-safe constants

### Response Format
```typescript
{
  data: T | null,
  meta: {
    timestamp: string,
    path: string,
    method: string
  },
  error?: {
    code: string,
    message: string,
    details?: any
  }
}
```

## 📜 Available Scripts

```bash
# Development
yarn start:dev          # Start with watch mode
yarn start:debug        # Start with debug mode

# Build
yarn build              # Build for production
yarn build:api          # Build API client package

# Code Quality
yarn lint               # Run ESLint
yarn format             # Format code with Prettier

# Testing
yarn test               # Run unit tests
yarn test:watch         # Run tests in watch mode
yarn test:cov           # Generate coverage report
yarn test:e2e           # Run end-to-end tests

# Database
yarn prisma:generate    # Generate Prisma client
yarn prisma:migrate     # Run migrations
yarn prisma:studio      # Open Prisma Studio

# OpenAPI
yarn generate:openapi   # Generate OpenAPI spec
```

## 🧪 Testing

### Unit Tests
```bash
yarn test
```

### E2E Tests
```bash
yarn test:e2e
```

### Coverage Report
```bash
yarn test:cov
```

## 📖 Documentation

Additional documentation is available in the `docs/` directory:

- **[DATABASE_DESIGN_GUIDE.md](docs/DATABASE_DESIGN_GUIDE.md)** - Database schema and design principles
- **[FIREBASE_QUICK_START.md](docs/FIREBASE_QUICK_START.md)** - Firebase setup and configuration
- **[FILE_SERVICE_GUIDE.md](docs/FILE_SERVICE_GUIDE.md)** - File service implementation guide
- **[IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md)** - Implementation overview
- **[POST_USER_DATA_STRATEGY.md](docs/POST_USER_DATA_STRATEGY.md)** - Data handling strategies

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the UNLICENSED License.

## 👥 Author

**Ventidole Team**

---

**Built with ❤️ using NestJS**
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ yarn install
```

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
