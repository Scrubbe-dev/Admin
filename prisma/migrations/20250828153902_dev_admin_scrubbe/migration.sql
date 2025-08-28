/*
  Warnings:

  - Added the required column `MTTR` to the `IncidentTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `IncidentTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `IncidentTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subCategory` to the `IncidentTicket` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'INVESTIGATION', 'MITIGATED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('EMAIL', 'SLACK', 'PORTAL', 'PHONE', 'OTHERS');

-- CreateEnum
CREATE TYPE "Impact" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'MANAGER';
ALTER TYPE "Role" ADD VALUE 'ANALYST';
ALTER TYPE "Role" ADD VALUE 'VIEWER';

-- DropForeignKey
ALTER TABLE "IncidentTicket" DROP CONSTRAINT "IncidentTicket_assignedTo_fkey";

-- AlterTable
ALTER TABLE "IncidentTicket" ADD COLUMN     "MTTR" TEXT NOT NULL,
ADD COLUMN     "affectedSystem" TEXT,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "escalate" TEXT,
ADD COLUMN     "impact" "Impact" NOT NULL DEFAULT 'LOW',
ADD COLUMN     "source" "Source" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "subCategory" TEXT NOT NULL,
ADD COLUMN     "suggestionFix" TEXT,
ALTER COLUMN "assignedTo" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "IncidentTicket" ADD CONSTRAINT "IncidentTicket_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "Invites"("email") ON DELETE SET NULL ON UPDATE CASCADE;
