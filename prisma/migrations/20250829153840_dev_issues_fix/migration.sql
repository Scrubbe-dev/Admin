/*
  Warnings:

  - You are about to drop the column `assignedToEmail` on the `IncidentTicket` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "IncidentTicket" DROP CONSTRAINT "IncidentTicket_assignedToEmail_fkey";

-- AlterTable
ALTER TABLE "IncidentTicket" DROP COLUMN "assignedToEmail",
ADD COLUMN     "assignedTo" TEXT;

-- AddForeignKey
ALTER TABLE "IncidentTicket" ADD CONSTRAINT "IncidentTicket_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "Invites"("email") ON DELETE SET NULL ON UPDATE CASCADE;
