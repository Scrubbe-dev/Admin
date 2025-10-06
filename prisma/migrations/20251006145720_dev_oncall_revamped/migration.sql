/*
  Warnings:

  - You are about to drop the column `endDate` on the `OnCallAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `OnCallAssignment` table. All the data in the column will be lost.
  - Added the required column `date` to the `OnCallAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "OnCallAssignment_endDate_idx";

-- DropIndex
DROP INDEX "OnCallAssignment_startDate_idx";

-- AlterTable
ALTER TABLE "OnCallAssignment" DROP COLUMN "endDate",
DROP COLUMN "startDate",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "OnCallAssignment_date_idx" ON "OnCallAssignment"("date");
