/*
  Warnings:

  - A unique constraint covering the columns `[businessId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_businessId_key" ON "User"("businessId");
