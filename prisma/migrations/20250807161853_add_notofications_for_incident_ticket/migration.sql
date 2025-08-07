-- CreateTable
CREATE TABLE "IncidentTicketNotification" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentTicketNotification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IncidentTicketNotification" ADD CONSTRAINT "IncidentTicketNotification_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentTicketNotification" ADD CONSTRAINT "IncidentTicketNotification_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "IncidentTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
