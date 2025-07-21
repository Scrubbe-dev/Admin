/*
  Warnings:

  - Changed the type of `role` on the `WaitingUser` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ResetTokenType" AS ENUM ('VERIFICATION_CODE', 'RESET_LINK');

-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('CISO', 'SECURITY_ENGINEER', 'SOC_ANALYST', 'IT_MANAGER', 'OTHERS');

-- DropIndex
DROP INDEX "User_apiKey_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "experience" TEXT,
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "username" TEXT,
ALTER COLUMN "apiKey" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WaitingUser" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "ResetTokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "ResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResetToken_token_idx" ON "ResetToken"("token");

-- CreateIndex
CREATE INDEX "ResetToken_userId_idx" ON "ResetToken"("userId");

-- CreateIndex
CREATE INDEX "ResetToken_type_idx" ON "ResetToken"("type");

-- CreateIndex
CREATE INDEX "ResetToken_expiresAt_idx" ON "ResetToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "ResetToken" ADD CONSTRAINT "ResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
