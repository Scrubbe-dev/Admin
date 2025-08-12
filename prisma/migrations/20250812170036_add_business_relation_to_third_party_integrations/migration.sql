-- AlterTable
ALTER TABLE "UserThirdpartyIntegration" ADD COLUMN     "businessId" TEXT;

-- AddForeignKey
ALTER TABLE "UserThirdpartyIntegration" ADD CONSTRAINT "UserThirdpartyIntegration_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
