-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IncidentStatus" ADD VALUE 'ACKNOWLEDGED';
ALTER TYPE "IncidentStatus" ADD VALUE 'INVESTIGATION';
ALTER TYPE "IncidentStatus" ADD VALUE 'MITIGATED';

-- AlterEnum
ALTER TYPE "Priority" ADD VALUE 'INFORMATIONAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Source" ADD VALUE 'HIGH';
ALTER TYPE "Source" ADD VALUE 'CRITICAL';
