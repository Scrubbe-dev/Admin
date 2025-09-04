/*
  Warnings:

  - You are about to drop the column `dashboardid` on the `Imssetup` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Imssetup" DROP CONSTRAINT "Imssetup_dashboardid_fkey";

-- AlterTable
ALTER TABLE "Imssetup" DROP COLUMN "dashboardid";

-- CreateTable
CREATE TABLE "ImssetupDashboard" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imssetupId" TEXT NOT NULL,
    "colorAccent" TEXT NOT NULL DEFAULT '#4A90E2',
    "defaultDashboard" "DashboardType" NOT NULL DEFAULT 'SCRUBBE_DASHBOARD_SOUR',
    "prefferedIntegration" "BusinessPrefferedIntegration"[] DEFAULT ARRAY['JIRA']::"BusinessPrefferedIntegration"[],
    "notificationChannels" "BusinessNotificationChannels"[] DEFAULT ARRAY['EMAIL']::"BusinessNotificationChannels"[],
    "defaultPriority" "Priority"[] DEFAULT ARRAY['MEDIUM']::"Priority"[],

    CONSTRAINT "ImssetupDashboard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImssetupDashboard_imssetupId_key" ON "ImssetupDashboard"("imssetupId");

-- AddForeignKey
ALTER TABLE "ImssetupDashboard" ADD CONSTRAINT "ImssetupDashboard_imssetupId_fkey" FOREIGN KEY ("imssetupId") REFERENCES "Imssetup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
