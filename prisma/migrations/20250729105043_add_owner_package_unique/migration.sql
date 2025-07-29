/*
  Warnings:

  - A unique constraint covering the columns `[ownerId,package]` on the table `ProjectConfiguration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProjectConfiguration_ownerId_package_key" ON "ProjectConfiguration"("ownerId", "package");
