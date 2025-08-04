/*
  Warnings:

  - The `recommendedActions` column on the `IncidentTicket` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DetermineAction" AS ENUM ('LOCK_ACCOUNT', 'NOTIFY_ANALYST', 'QUARANTINE', 'TERMINATE_SESSION');

-- AlterTable
ALTER TABLE "IncidentTicket" DROP COLUMN "recommendedActions",
ADD COLUMN     "recommendedActions" "DetermineAction"[],
ALTER COLUMN "riskScore" SET DEFAULT 20;
