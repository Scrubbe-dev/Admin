-- CreateTable
CREATE TABLE "Imssetup" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "incidentEmail" TEXT,
    "subdomain" TEXT,
    "industry" TEXT,
    "primaryRegion" TEXT,
    "logo" TEXT,
    "address" TEXT,
    "companySize" TEXT,
    "companyPurpose" TEXT,
    "purpose" TEXT,
    "dashBoardId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dashboardid" TEXT,

    CONSTRAINT "Imssetup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ImssetupToIncidentTicket" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ImssetupToIncidentTicket_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ImssetupToInvites" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ImssetupToInvites_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ImssetupToIncidentTicketNotification" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ImssetupToIncidentTicketNotification_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ImssetupToUserThirdpartyIntegration" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ImssetupToUserThirdpartyIntegration_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Imssetup_incidentEmail_key" ON "Imssetup"("incidentEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Imssetup_subdomain_key" ON "Imssetup"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Imssetup_dashBoardId_key" ON "Imssetup"("dashBoardId");

-- CreateIndex
CREATE UNIQUE INDEX "Imssetup_userId_key" ON "Imssetup"("userId");

-- CreateIndex
CREATE INDEX "_ImssetupToIncidentTicket_B_index" ON "_ImssetupToIncidentTicket"("B");

-- CreateIndex
CREATE INDEX "_ImssetupToInvites_B_index" ON "_ImssetupToInvites"("B");

-- CreateIndex
CREATE INDEX "_ImssetupToIncidentTicketNotification_B_index" ON "_ImssetupToIncidentTicketNotification"("B");

-- CreateIndex
CREATE INDEX "_ImssetupToUserThirdpartyIntegration_B_index" ON "_ImssetupToUserThirdpartyIntegration"("B");

-- AddForeignKey
ALTER TABLE "Imssetup" ADD CONSTRAINT "Imssetup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Imssetup" ADD CONSTRAINT "Imssetup_dashboardid_fkey" FOREIGN KEY ("dashboardid") REFERENCES "BusinessDashboard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImssetupToIncidentTicket" ADD CONSTRAINT "_ImssetupToIncidentTicket_A_fkey" FOREIGN KEY ("A") REFERENCES "Imssetup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImssetupToIncidentTicket" ADD CONSTRAINT "_ImssetupToIncidentTicket_B_fkey" FOREIGN KEY ("B") REFERENCES "IncidentTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImssetupToInvites" ADD CONSTRAINT "_ImssetupToInvites_A_fkey" FOREIGN KEY ("A") REFERENCES "Imssetup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImssetupToInvites" ADD CONSTRAINT "_ImssetupToInvites_B_fkey" FOREIGN KEY ("B") REFERENCES "Invites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImssetupToIncidentTicketNotification" ADD CONSTRAINT "_ImssetupToIncidentTicketNotification_A_fkey" FOREIGN KEY ("A") REFERENCES "Imssetup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImssetupToIncidentTicketNotification" ADD CONSTRAINT "_ImssetupToIncidentTicketNotification_B_fkey" FOREIGN KEY ("B") REFERENCES "IncidentTicketNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImssetupToUserThirdpartyIntegration" ADD CONSTRAINT "_ImssetupToUserThirdpartyIntegration_A_fkey" FOREIGN KEY ("A") REFERENCES "Imssetup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImssetupToUserThirdpartyIntegration" ADD CONSTRAINT "_ImssetupToUserThirdpartyIntegration_B_fkey" FOREIGN KEY ("B") REFERENCES "UserThirdpartyIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
