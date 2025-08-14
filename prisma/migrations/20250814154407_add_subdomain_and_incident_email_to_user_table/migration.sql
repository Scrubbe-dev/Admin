/*
  Warnings:

  - A unique constraint covering the columns `[incidentEmail]` on the table `Business` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subdomain]` on the table `Business` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "incidentEmail" TEXT,
ADD COLUMN     "subdomain" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "integrated" "BusinessNotificationChannels"[];

-- CreateIndex
CREATE UNIQUE INDEX "Business_incidentEmail_key" ON "Business"("incidentEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Business_subdomain_key" ON "Business"("subdomain");
