-- AlterTable
ALTER TABLE "User" ADD COLUMN     "scope" TEXT[] DEFAULT ARRAY['api-key:create']::TEXT[];
