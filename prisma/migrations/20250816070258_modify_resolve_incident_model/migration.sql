/*
  Warnings:

  - You are about to drop the column `identificationSteps` on the `ResolveIncident` table. All the data in the column will be lost.
  - You are about to drop the column `knowledgeSummary` on the `ResolveIncident` table. All the data in the column will be lost.
  - You are about to drop the column `knowledgeTags` on the `ResolveIncident` table. All the data in the column will be lost.
  - You are about to drop the column `knowledgeTitle` on the `ResolveIncident` table. All the data in the column will be lost.
  - You are about to drop the column `preventiveMeasures` on the `ResolveIncident` table. All the data in the column will be lost.
  - You are about to drop the column `resolutionSteps` on the `ResolveIncident` table. All the data in the column will be lost.
  - Added the required column `identificationStepsInternal` to the `ResolveIncident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `knowledgeSummaryCustomer` to the `ResolveIncident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `knowledgeSummaryInternal` to the `ResolveIncident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `knowledgeTitleCustomer` to the `ResolveIncident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `knowledgeTitleInternal` to the `ResolveIncident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preventiveMeasuresInternal` to the `ResolveIncident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resolutionStepsInternal` to the `ResolveIncident` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ResolveIncident" DROP COLUMN "identificationSteps",
DROP COLUMN "knowledgeSummary",
DROP COLUMN "knowledgeTags",
DROP COLUMN "knowledgeTitle",
DROP COLUMN "preventiveMeasures",
DROP COLUMN "resolutionSteps",
ADD COLUMN     "identificationStepsInternal" TEXT NOT NULL,
ADD COLUMN     "knowledgeSummaryCustomer" TEXT NOT NULL,
ADD COLUMN     "knowledgeSummaryInternal" TEXT NOT NULL,
ADD COLUMN     "knowledgeTagsInternal" TEXT[],
ADD COLUMN     "knowledgeTitleCustomer" TEXT NOT NULL,
ADD COLUMN     "knowledgeTitleInternal" TEXT NOT NULL,
ADD COLUMN     "preventiveMeasuresInternal" TEXT NOT NULL,
ADD COLUMN     "resolutionStepsInternal" TEXT NOT NULL;
