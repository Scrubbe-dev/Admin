/*
  Warnings:

  - Added the required column `accepted` to the `Invites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `acceptedAt` to the `Invites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `Invites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stillAMember` to the `Invites` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invites" ADD COLUMN     "accepted" BOOLEAN NOT NULL,
ADD COLUMN     "acceptedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "position" TEXT NOT NULL,
ADD COLUMN     "stillAMember" BOOLEAN NOT NULL;
