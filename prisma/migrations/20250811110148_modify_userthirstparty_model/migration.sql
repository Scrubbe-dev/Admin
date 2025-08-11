/*
  Warnings:

  - You are about to drop the column `botToken` on the `UserThirdpartyIntegration` table. All the data in the column will be lost.
  - You are about to drop the column `defaultChannel` on the `UserThirdpartyIntegration` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `UserThirdpartyIntegration` table. All the data in the column will be lost.
  - You are about to drop the column `teamName` on the `UserThirdpartyIntegration` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserThirdpartyIntegration" DROP COLUMN "botToken",
DROP COLUMN "defaultChannel",
DROP COLUMN "teamId",
DROP COLUMN "teamName",
ADD COLUMN     "defaultTarget" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "refreshToken" TEXT,
ALTER COLUMN "accessToken" DROP NOT NULL;
