-- CreateEnum
CREATE TYPE "CauseCategory" AS ENUM ('SOFTWARE_BUG', 'NETWORK_ISSUE', 'HUMAN_ERROR', 'DATA_BREACH');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DEALT_WITH');

-- CreateEnum
CREATE TYPE "TICKETING_SYSTEMS" AS ENUM ('JIRA_TICKETS', 'SERVICENOW_TICKETS', 'FRESHDESK_TICKETS');

-- CreateEnum
CREATE TYPE "COMMUNICATION_CHANNEL" AS ENUM ('EMAIL', 'SLACK', 'PUBLIC_ANNOUNCEMENT', 'CUSTOMER_PORTAL');

-- CreateTable
CREATE TABLE "ResolveIncident" (
    "id" TEXT NOT NULL,
    "incidentTicketId" TEXT NOT NULL,
    "causeCategory" "CauseCategory" NOT NULL,
    "rootCause" TEXT NOT NULL,
    "why1" TEXT NOT NULL,
    "why2" TEXT NOT NULL,
    "why3" TEXT NOT NULL,
    "why4" TEXT NOT NULL,
    "why5" TEXT NOT NULL,
    "temporaryFix" TEXT NOT NULL,
    "permanentFix" TEXT NOT NULL,
    "knowledgeTitle" TEXT NOT NULL,
    "knowledgeSummary" TEXT NOT NULL,
    "identificationSteps" TEXT NOT NULL,
    "resolutionSteps" TEXT NOT NULL,
    "preventiveMeasures" TEXT NOT NULL,
    "knowledgeTags" TEXT[],
    "followUpTask" TEXT NOT NULL,
    "followUpOwner" TEXT NOT NULL,
    "followUpDueDate" TIMESTAMP(3) NOT NULL,
    "followUpStatus" "FollowUpStatus" NOT NULL,
    "followUpTicketingSystems" "TICKETING_SYSTEMS"[],
    "communicationChannel" "COMMUNICATION_CHANNEL" NOT NULL,
    "targetStakeholders" TEXT[],
    "messageContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResolveIncident_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ResolveIncident" ADD CONSTRAINT "ResolveIncident_incidentTicketId_fkey" FOREIGN KEY ("incidentTicketId") REFERENCES "IncidentTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
