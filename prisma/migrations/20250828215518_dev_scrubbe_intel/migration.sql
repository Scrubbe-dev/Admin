-- CreateEnum
CREATE TYPE "EscalationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "EscalatedIncident" (
    "id" TEXT NOT NULL,
    "incidentTicketId" TEXT NOT NULL,
    "escalatedToUserId" TEXT NOT NULL,
    "escalatedById" TEXT NOT NULL,
    "escalationReason" TEXT,
    "escalatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EscalationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "EscalatedIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intel" (
    "id" TEXT NOT NULL,
    "incidentTicketId" TEXT NOT NULL,
    "intelType" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Intel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EscalatedIncident_incidentTicketId_idx" ON "EscalatedIncident"("incidentTicketId");

-- CreateIndex
CREATE INDEX "EscalatedIncident_escalatedToUserId_idx" ON "EscalatedIncident"("escalatedToUserId");

-- CreateIndex
CREATE INDEX "EscalatedIncident_escalatedById_idx" ON "EscalatedIncident"("escalatedById");

-- CreateIndex
CREATE INDEX "Intel_incidentTicketId_idx" ON "Intel"("incidentTicketId");

-- AddForeignKey
ALTER TABLE "EscalatedIncident" ADD CONSTRAINT "EscalatedIncident_incidentTicketId_fkey" FOREIGN KEY ("incidentTicketId") REFERENCES "IncidentTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalatedIncident" ADD CONSTRAINT "EscalatedIncident_escalatedToUserId_fkey" FOREIGN KEY ("escalatedToUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalatedIncident" ADD CONSTRAINT "EscalatedIncident_escalatedById_fkey" FOREIGN KEY ("escalatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intel" ADD CONSTRAINT "Intel_incidentTicketId_fkey" FOREIGN KEY ("incidentTicketId") REFERENCES "IncidentTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
