/*
  Warnings:

  - The `followUpTicketingSystems` column on the `ResolveIncident` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[incidentTicketId]` on the table `ResolveIncident` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ResolveIncident" DROP COLUMN "followUpTicketingSystems",
ADD COLUMN     "followUpTicketingSystems" "BusinessPrefferedIntegration"[];

-- DropEnum
DROP TYPE "TICKETING_SYSTEMS";

-- CreateIndex
CREATE UNIQUE INDEX "ResolveIncident_incidentTicketId_key" ON "ResolveIncident"("incidentTicketId");
