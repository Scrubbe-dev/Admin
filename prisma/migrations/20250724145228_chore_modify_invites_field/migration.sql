/*
  Warnings:

  - You are about to drop the `InviteMembers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "InviteMembers" DROP CONSTRAINT "InviteMembers_sentById_fkey";

-- DropTable
DROP TABLE "InviteMembers";

-- CreateTable
CREATE TABLE "Invites" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "accessPermissions" "AccessPermissions" NOT NULL,
    "sentById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invites_email_key" ON "Invites"("email");

-- CreateIndex
CREATE INDEX "Invites_sentById_idx" ON "Invites"("sentById");

-- AddForeignKey
ALTER TABLE "Invites" ADD CONSTRAINT "Invites_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
