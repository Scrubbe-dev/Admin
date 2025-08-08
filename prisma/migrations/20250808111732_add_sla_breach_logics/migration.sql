/*
  Warnings:

  - You are about to drop the column `slaStatus` on the `IncidentTicket` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SLABreachType" AS ENUM ('ACK', 'RESOLVE');

-- CreateEnum
CREATE TYPE "SLAStatus" AS ENUM ('PENDING', 'MET', 'BREACHED');

-- AlterTable
ALTER TABLE "IncidentTicket" DROP COLUMN "slaStatus",
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "firstAcknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "slaTargetAck" TIMESTAMP(3),
ADD COLUMN     "slaTargetResolve" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SLABreachAuditLog" (
    "id" TEXT NOT NULL,
    "slaType" "SLABreachType" NOT NULL,
    "breachedAt" TIMESTAMP(3) NOT NULL,
    "breachDurationMinutes" INTEGER NOT NULL,
    "incidentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SLABreachAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SLABreachAuditLog_incidentId_idx" ON "SLABreachAuditLog"("incidentId");

-- CreateIndex
CREATE INDEX "SLABreachAuditLog_slaType_idx" ON "SLABreachAuditLog"("slaType");

-- CreateIndex
CREATE INDEX "SLABreachAuditLog_createdAt_idx" ON "SLABreachAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "SLABreachAuditLog" ADD CONSTRAINT "SLABreachAuditLog_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "IncidentTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
