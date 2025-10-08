-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FAN', 'ADMIN', 'IDOL');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('FIND_EMAIL', 'RESET_PASSWORD', 'REGISTER_ACCOUNT', 'UPDATE_PROFILE');

-- CreateEnum
CREATE TYPE "SocialAccountProvider" AS ENUM ('GOOGLE', 'FACEBOOK');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "name" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "phoneNumber" VARCHAR(255),
    "password" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "deviceToken" VARCHAR(255),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "type" "VerificationType" NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accountId" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "provider" "SocialAccountProvider" NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_unique_partial" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_token_key" ON "verifications"("token");

-- CreateIndex
CREATE INDEX "verifications_token_idx" ON "verifications"("token");

-- CreateIndex
CREATE INDEX "verifications_accountId_idx" ON "verifications"("accountId");

-- CreateIndex
CREATE INDEX "verifications_expires_at_idx" ON "verifications"("expires_at");

-- CreateIndex
CREATE INDEX "social_accounts_user_id_idx" ON "social_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_accounts_provider_provider_id_key" ON "social_accounts"("provider", "provider_id");

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
