-- DropIndex
DROP INDEX "User_businessId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "businessOwner" TEXT;
