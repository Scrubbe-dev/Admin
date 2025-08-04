-- AlterTable
ALTER TABLE "IncidentTicket" ADD COLUMN     "recommendedActions" TEXT[],
ADD COLUMN     "riskScore" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "slaStatus" TIMESTAMP(3);
