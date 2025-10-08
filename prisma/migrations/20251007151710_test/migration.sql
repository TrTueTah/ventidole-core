/*
  Warnings:

  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."social_accounts" DROP CONSTRAINT "social_accounts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."verifications" DROP CONSTRAINT "verifications_accountId_fkey";

-- DropTable
DROP TABLE "public"."Account";

-- CreateTable
CREATE TABLE "accounts" (
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

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_unique_partial" ON "accounts"("email");

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
