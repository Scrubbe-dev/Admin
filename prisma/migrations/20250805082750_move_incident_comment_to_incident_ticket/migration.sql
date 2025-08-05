-- DropForeignKey
ALTER TABLE "IncidentComment" DROP CONSTRAINT "IncidentComment_incidentId_fkey";

-- AlterTable
ALTER TABLE "IncidentComment" ADD COLUMN     "incidentTicketId" TEXT;

-- AddForeignKey
ALTER TABLE "IncidentComment" ADD CONSTRAINT "IncidentComment_incidentTicketId_fkey" FOREIGN KEY ("incidentTicketId") REFERENCES "IncidentTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
