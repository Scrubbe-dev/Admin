-- CreateEnum
CREATE TYPE "OnCallStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "OnCallAssignment" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "OnCallStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnCallAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnCallTeamMember" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnCallTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OnCallAssignment_startDate_idx" ON "OnCallAssignment"("startDate");

-- CreateIndex
CREATE INDEX "OnCallAssignment_endDate_idx" ON "OnCallAssignment"("endDate");

-- CreateIndex
CREATE INDEX "OnCallAssignment_status_idx" ON "OnCallAssignment"("status");

-- CreateIndex
CREATE INDEX "OnCallTeamMember_memberId_idx" ON "OnCallTeamMember"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "OnCallTeamMember_assignmentId_memberId_key" ON "OnCallTeamMember"("assignmentId", "memberId");

-- AddForeignKey
ALTER TABLE "OnCallTeamMember" ADD CONSTRAINT "OnCallTeamMember_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "OnCallAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnCallTeamMember" ADD CONSTRAINT "OnCallTeamMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
