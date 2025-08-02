/*
  Warnings:

  - You are about to drop the column `scope` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "scope",
ADD COLUMN     "scopes" TEXT[] DEFAULT ARRAY['api-key:create']::TEXT[];
