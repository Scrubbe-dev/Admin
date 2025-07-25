/*
  Warnings:

  - You are about to drop the column `userId` on the `BusinessDashboard` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "BusinessDashboard" DROP CONSTRAINT "BusinessDashboard_userId_fkey";

-- AlterTable
ALTER TABLE "BusinessDashboard" DROP COLUMN "userId";
