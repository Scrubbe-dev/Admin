/*
  Warnings:

  - A unique constraint covering the columns `[userId,provider]` on the table `UserThirdpartyIntegration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserThirdpartyIntegration_userId_provider_key" ON "UserThirdpartyIntegration"("userId", "provider");
