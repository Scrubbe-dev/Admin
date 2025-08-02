-- CreateEnum
CREATE TYPE "IncidentTemplate" AS ENUM ('NONE', 'PHISHING', 'MALWARE');

-- CreateEnum
CREATE TYPE "APIkeyEnvironment" AS ENUM ('DEVELOPMENT', 'PRODUCTION');

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "template" "IncidentTemplate" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "environment" "APIkeyEnvironment" NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scopes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
