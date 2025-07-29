-- CreateTable
CREATE TABLE "ProjectConfiguration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enviroment" TEXT NOT NULL,
    "domain" TEXT,
    "description" TEXT,
    "module" TEXT,
    "lastseen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "ProjectConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectConfiguration_ownerId_idx" ON "ProjectConfiguration"("ownerId");

-- AddForeignKey
ALTER TABLE "ProjectConfiguration" ADD CONSTRAINT "ProjectConfiguration_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
