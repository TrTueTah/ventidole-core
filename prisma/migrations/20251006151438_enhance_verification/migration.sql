-- AlterTable
ALTER TABLE "verifications" ADD COLUMN     "confirmed_at" TIMESTAMP(3),
ADD COLUMN     "email" VARCHAR(255),
ALTER COLUMN "accountId" DROP NOT NULL;
