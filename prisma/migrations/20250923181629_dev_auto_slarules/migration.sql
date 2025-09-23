-- AlterTable
ALTER TABLE "IncidentTicket" ADD COLUMN     "slaResolveBreachNotified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slaResolveHalfNotified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slaResolveTimeMinutes" INTEGER,
ADD COLUMN     "slaResponseBreachNotified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slaResponseHalfNotified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slaResponseTimeMinutes" INTEGER,
ADD COLUMN     "slaSeverity" TEXT;
