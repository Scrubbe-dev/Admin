-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BusinessNotificationChannels" ADD VALUE 'GOOGLE_MEET';
ALTER TYPE "BusinessNotificationChannels" ADD VALUE 'ZOOM';
ALTER TYPE "BusinessNotificationChannels" ADD VALUE 'PAGERDUTY';
ALTER TYPE "BusinessNotificationChannels" ADD VALUE 'WHATSAPP';
