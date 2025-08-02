/*
  Warnings:

  - Added the required column `assignedById` to the `IncidentTicket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "IncidentTicket" ADD COLUMN     "assignedById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "IncidentTicket" ADD CONSTRAINT "IncidentTicket_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
