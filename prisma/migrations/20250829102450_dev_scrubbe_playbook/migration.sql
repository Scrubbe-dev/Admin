-- AlterTable
ALTER TABLE "PlaybookExecution" ADD COLUMN     "playbookId" TEXT;

-- CreateTable
CREATE TABLE "Playbook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB,
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketPlaybookRecommendation" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "recommended" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketPlaybookRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Playbook_name_key" ON "Playbook"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TicketPlaybookRecommendation_ticketId_playbookId_key" ON "TicketPlaybookRecommendation"("ticketId", "playbookId");

-- AddForeignKey
ALTER TABLE "PlaybookExecution" ADD CONSTRAINT "PlaybookExecution_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "Playbook"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPlaybookRecommendation" ADD CONSTRAINT "TicketPlaybookRecommendation_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "IncidentTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPlaybookRecommendation" ADD CONSTRAINT "TicketPlaybookRecommendation_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "Playbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
