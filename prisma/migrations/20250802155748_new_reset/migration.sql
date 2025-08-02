/*
  Warnings:

  - You are about to drop the column `assignToId` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `template` on the `Incident` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Incident" DROP COLUMN "assignToId",
DROP COLUMN "template";

-- CreateTable
CREATE TABLE "IncidentTicket" (
    "id" TEXT NOT NULL,
    "template" "IncidentTemplate" NOT NULL DEFAULT 'NONE',
    "userName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "priority" "Priority",
    "assignedTo" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncidentTicket_incidentId_key" ON "IncidentTicket"("incidentId");

-- AddForeignKey
ALTER TABLE "IncidentTicket" ADD CONSTRAINT "IncidentTicket_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
