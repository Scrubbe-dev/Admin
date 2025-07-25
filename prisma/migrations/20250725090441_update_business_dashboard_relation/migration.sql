-- DropForeignKey
ALTER TABLE "Business" DROP CONSTRAINT "Business_dashBoardId_fkey";

-- DropForeignKey
ALTER TABLE "BusinessDashboard" DROP CONSTRAINT "BusinessDashboard_businessId_fkey";

-- AlterTable
ALTER TABLE "BusinessDashboard" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "BusinessDashboard" ADD CONSTRAINT "BusinessDashboard_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessDashboard" ADD CONSTRAINT "BusinessDashboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
