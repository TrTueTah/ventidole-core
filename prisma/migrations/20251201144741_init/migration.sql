-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FAN', 'ADMIN', 'IDOL');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('FIND_EMAIL', 'RESET_PASSWORD', 'REGISTER_ACCOUNT', 'UPDATE_PROFILE');

-- CreateEnum
CREATE TYPE "SocialAccountProvider" AS ENUM ('GOOGLE', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "ChatChannelType" AS ENUM ('DIRECT', 'GROUP', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "metadata" JSONB,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "deviceToken" VARCHAR(255),
    "avatar_url" VARCHAR(255),
    "background_url" VARCHAR(255),
    "bio" VARCHAR(500),
    "communityId" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "metadata" JSONB,
    "type" "VerificationType" NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "used_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "email" VARCHAR(255),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_account" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "metadata" JSONB,
    "provider" "SocialAccountProvider" NOT NULL,
    "provider_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "social_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "metadata" JSONB,
    "name" VARCHAR(100) NOT NULL,
    "avatar_url" VARCHAR(255),
    "background_url" VARCHAR(255),
    "description" VARCHAR(500),

    CONSTRAINT "community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_follower" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,

    CONSTRAINT "community_follower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_channel" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "metadata" JSONB,
    "name" VARCHAR(255),
    "description" VARCHAR(500),
    "type" "ChatChannelType" NOT NULL,
    "communityId" TEXT,
    "idolId" TEXT,
    "is_announcement" BOOLEAN NOT NULL DEFAULT false,
    "last_message_at" TIMESTAMP(3),
    "firebase_doc_id" VARCHAR(255) NOT NULL,

    CONSTRAINT "chat_channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_participant" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "metadata" JSONB,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL DEFAULT 'MEMBER',
    "last_read_at" TIMESTAMP(3),
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "is_muted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "chat_participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_unique_partial" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_key" ON "verification"("token");

-- CreateIndex
CREATE INDEX "verification_token_idx" ON "verification"("token");

-- CreateIndex
CREATE INDEX "verification_userId_idx" ON "verification"("userId");

-- CreateIndex
CREATE INDEX "verification_expires_at_idx" ON "verification"("expires_at");

-- CreateIndex
CREATE INDEX "social_account_userId_idx" ON "social_account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "social_account_provider_provider_id_key" ON "social_account"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "community_follower_userId_idx" ON "community_follower"("userId");

-- CreateIndex
CREATE INDEX "community_follower_communityId_idx" ON "community_follower"("communityId");

-- CreateIndex
CREATE UNIQUE INDEX "community_follower_userId_communityId_key" ON "community_follower"("userId", "communityId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_channel_firebase_doc_id_key" ON "chat_channel"("firebase_doc_id");

-- CreateIndex
CREATE INDEX "chat_channel_communityId_idx" ON "chat_channel"("communityId");

-- CreateIndex
CREATE INDEX "chat_channel_idolId_idx" ON "chat_channel"("idolId");

-- CreateIndex
CREATE INDEX "chat_channel_type_idx" ON "chat_channel"("type");

-- CreateIndex
CREATE INDEX "chat_channel_last_message_at_idx" ON "chat_channel"("last_message_at");

-- CreateIndex
CREATE INDEX "chat_participant_userId_idx" ON "chat_participant"("userId");

-- CreateIndex
CREATE INDEX "chat_participant_channelId_idx" ON "chat_participant"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_participant_channelId_userId_key" ON "chat_participant"("channelId", "userId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification" ADD CONSTRAINT "verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_account" ADD CONSTRAINT "social_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_follower" ADD CONSTRAINT "community_follower_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_follower" ADD CONSTRAINT "community_follower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_channel" ADD CONSTRAINT "chat_channel_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_channel" ADD CONSTRAINT "chat_channel_idolId_fkey" FOREIGN KEY ("idolId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participant" ADD CONSTRAINT "chat_participant_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "chat_channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participant" ADD CONSTRAINT "chat_participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
