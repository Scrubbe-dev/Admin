/*
  Warnings:

  - You are about to drop the column `status` on the `Incident` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Incident_status_priority_idx";

-- AlterTable
ALTER TABLE "Incident" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "IncidentTicket" ADD COLUMN     "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN';

-- CreateIndex
CREATE INDEX "Incident_priority_createdAt_idx" ON "Incident"("priority", "createdAt");
