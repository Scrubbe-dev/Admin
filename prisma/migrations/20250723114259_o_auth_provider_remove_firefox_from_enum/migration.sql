/*
  Warnings:

  - The values [FIREFOX] on the enum `OAuthProvider` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OAuthProvider_new" AS ENUM ('GOOGLE', 'AWS', 'GITHUB', 'GITLAB', 'AZURE');
ALTER TABLE "User" ALTER COLUMN "oauthprovider" TYPE "OAuthProvider_new" USING ("oauthprovider"::text::"OAuthProvider_new");
ALTER TYPE "OAuthProvider" RENAME TO "OAuthProvider_old";
ALTER TYPE "OAuthProvider_new" RENAME TO "OAuthProvider";
DROP TYPE "OAuthProvider_old";
COMMIT;
