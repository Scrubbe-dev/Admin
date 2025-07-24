-- CreateEnum
CREATE TYPE "AccessPermissions" AS ENUM ('VIEW_DASHBOARD', 'MODIFY_DASHBOARD', 'EXECUTE_ACTIONS', 'MANAGE_USERS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyLogo" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "primaryRegion" TEXT;

-- CreateTable
CREATE TABLE "InviteMembers" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "accessPermissions" "AccessPermissions" NOT NULL,

    CONSTRAINT "InviteMembers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteMembers_email_key" ON "InviteMembers"("email");
