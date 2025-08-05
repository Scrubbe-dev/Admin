/*
  Warnings:

  - You are about to drop the column `isAdmin` on the `IncidentComment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "IncidentComment" DROP COLUMN "isAdmin",
ADD COLUMN     "isBusinessOwner" BOOLEAN NOT NULL DEFAULT false;
