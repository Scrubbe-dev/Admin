/*
  Warnings:

  - You are about to drop the column `assignedTo` on the `IncidentTicket` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "IncidentTicket" DROP CONSTRAINT "IncidentTicket_assignedTo_fkey";

-- AlterTable
ALTER TABLE "IncidentTicket" DROP COLUMN "assignedTo",
ADD COLUMN     "assignedToEmail" TEXT;

-- AddForeignKey
ALTER TABLE "IncidentTicket" ADD CONSTRAINT "IncidentTicket_assignedToEmail_fkey" FOREIGN KEY ("assignedToEmail") REFERENCES "Invites"("email") ON DELETE SET NULL ON UPDATE CASCADE;
