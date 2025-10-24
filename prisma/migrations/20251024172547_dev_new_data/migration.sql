/*
  Warnings:

  - You are about to drop the column `userId` on the `Business` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Business_userId_key";

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "userId";

-- CreateIndex
CREATE INDEX "IncidentTicket_createdById_idx" ON "IncidentTicket"("createdById");

-- CreateIndex
CREATE INDEX "IncidentTicket_assignedById_idx" ON "IncidentTicket"("assignedById");

-- CreateIndex
CREATE INDEX "IncidentTicket_businessId_idx" ON "IncidentTicket"("businessId");

-- CreateIndex
CREATE INDEX "User_businessId_idx" ON "User"("businessId");
