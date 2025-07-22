/*
  Warnings:

  - A unique constraint covering the columns `[sentTo]` on the table `VerificationOTP` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sentTo` to the `VerificationOTP` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VerificationOTP" ADD COLUMN     "sentTo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "VerificationOTP_sentTo_key" ON "VerificationOTP"("sentTo");
