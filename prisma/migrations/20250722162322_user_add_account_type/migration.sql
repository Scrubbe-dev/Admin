-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('DEVELOPER', 'BUSINESS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" "AccountType";
