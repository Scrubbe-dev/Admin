-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('GOOGLE', 'AWS', 'GITHUB', 'FIREFOX', 'GITLAB', 'AZURE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT,
ADD COLUMN     "oauthprovider" "OAuthProvider",
ADD COLUMN     "registerdWithOauth" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "passwordHash" DROP NOT NULL;
