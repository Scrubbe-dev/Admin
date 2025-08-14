-- AlterTable
ALTER TABLE "UserThirdpartyIntegration" ADD COLUMN     "assignedToEmail" TEXT;

-- AddForeignKey
ALTER TABLE "UserThirdpartyIntegration" ADD CONSTRAINT "UserThirdpartyIntegration_assignedToEmail_fkey" FOREIGN KEY ("assignedToEmail") REFERENCES "Invites"("email") ON DELETE SET NULL ON UPDATE CASCADE;
