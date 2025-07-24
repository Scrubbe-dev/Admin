/*
  Warnings:

  - Added the required column `companyName` to the `InviteMembers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `InviteMembers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sentById` to the `InviteMembers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DashboardType" AS ENUM ('SCRUBBE_DASHBOARD_SIEM', 'SCRUBBE_DASHBOARD_SOUR', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BusinessPrefferedIntegration" AS ENUM ('JIRA', 'FRESH_DESK', 'SERVICE_NOW');

-- CreateEnum
CREATE TYPE "BusinessNotificationChannels" AS ENUM ('JIRA', 'FRESH_DESK', 'SERVICE_NOW');

-- AlterTable
ALTER TABLE "InviteMembers" ADD COLUMN     "companyName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "sentById" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "BusinessDashboardSettings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownedById" TEXT NOT NULL,
    "colorAccent" TEXT NOT NULL,
    "defaultDashboard" "DashboardType" NOT NULL,
    "prefferedIntegration" "BusinessPrefferedIntegration" NOT NULL,
    "notificationChannels" "BusinessNotificationChannels" NOT NULL,
    "defaultPriority" "Priority" NOT NULL,

    CONSTRAINT "BusinessDashboardSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessDashboardSettings_ownedById_key" ON "BusinessDashboardSettings"("ownedById");

-- CreateIndex
CREATE INDEX "InviteMembers_sentById_idx" ON "InviteMembers"("sentById");

-- AddForeignKey
ALTER TABLE "InviteMembers" ADD CONSTRAINT "InviteMembers_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessDashboardSettings" ADD CONSTRAINT "BusinessDashboardSettings_ownedById_fkey" FOREIGN KEY ("ownedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
