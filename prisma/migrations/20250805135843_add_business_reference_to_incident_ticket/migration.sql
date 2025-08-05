/*
  Warnings:

  - You are about to drop the column `position` on the `Invites` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "IncidentTicket" ADD COLUMN     "businessId" TEXT,
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'LOW';

-- AlterTable
ALTER TABLE "Invites" DROP COLUMN "position";

-- AddForeignKey
ALTER TABLE "IncidentTicket" ADD CONSTRAINT "IncidentTicket_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
