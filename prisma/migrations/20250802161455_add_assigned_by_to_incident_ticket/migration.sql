/*
  Warnings:

  - You are about to drop the column `incidentId` on the `IncidentTicket` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "IncidentTicket" DROP CONSTRAINT "IncidentTicket_incidentId_fkey";

-- DropIndex
DROP INDEX "IncidentTicket_incidentId_key";

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "incidentTicketId" TEXT;

-- AlterTable
ALTER TABLE "IncidentTicket" DROP COLUMN "incidentId";

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_incidentTicketId_fkey" FOREIGN KEY ("incidentTicketId") REFERENCES "IncidentTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
