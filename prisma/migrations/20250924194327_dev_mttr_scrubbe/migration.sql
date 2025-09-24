-- AlterTable
ALTER TABLE "IncidentTicket" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "mttrResolveBreachNotified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mttrResolveHalfNotified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mttrResponseBreachNotified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mttrResponseHalfNotified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mttrTargetAck" TIMESTAMP(3),
ADD COLUMN     "mttrTargetResolve" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "IncidentTicket" ADD CONSTRAINT "IncidentTicket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
