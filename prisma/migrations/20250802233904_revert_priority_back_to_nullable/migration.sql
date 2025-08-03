/*
  Warnings:

  - A unique constraint covering the columns `[ticketId]` on the table `IncidentTicket` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "IncidentTicket" ADD COLUMN     "ticketId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "IncidentTicket_ticketId_key" ON "IncidentTicket"("ticketId");
