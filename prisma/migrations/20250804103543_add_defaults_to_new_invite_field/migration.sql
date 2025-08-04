-- AlterTable
ALTER TABLE "Invites" ALTER COLUMN "accepted" SET DEFAULT false,
ALTER COLUMN "acceptedAt" DROP NOT NULL,
ALTER COLUMN "stillAMember" SET DEFAULT true;
