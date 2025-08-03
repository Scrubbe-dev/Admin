/*
  Warnings:

  - Made the column `priority` on table `IncidentTicket` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ticketId` on table `IncidentTicket` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "IncidentTicket" ALTER COLUMN "priority" SET NOT NULL,
ALTER COLUMN "ticketId" SET NOT NULL;
