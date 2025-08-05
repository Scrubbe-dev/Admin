/*
  Warnings:

  - You are about to drop the column `incidentId` on the `IncidentComment` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "IncidentComment_incidentId_idx";

-- AlterTable
ALTER TABLE "IncidentComment" DROP COLUMN "incidentId";

-- CreateIndex
CREATE INDEX "IncidentComment_incidentTicketId_idx" ON "IncidentComment"("incidentTicketId");
