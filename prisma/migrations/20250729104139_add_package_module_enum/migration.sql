/*
  Warnings:

  - You are about to drop the column `module` on the `ProjectConfiguration` table. All the data in the column will be lost.
  - Added the required column `package` to the `ProjectConfiguration` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PackageModule" AS ENUM ('FINGERPRINT');

-- AlterTable
ALTER TABLE "ProjectConfiguration" DROP COLUMN "module",
ADD COLUMN     "modules" TEXT[],
ADD COLUMN     "package" "PackageModule" NOT NULL;
