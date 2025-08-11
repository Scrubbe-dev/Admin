-- CreateTable
CREATE TABLE "UserThirdpartyIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "BusinessNotificationChannels" NOT NULL,
    "accessToken" TEXT NOT NULL,
    "botToken" TEXT NOT NULL,
    "teamId" TEXT,
    "teamName" TEXT,
    "defaultChannel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserThirdpartyIntegration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserThirdpartyIntegration" ADD CONSTRAINT "UserThirdpartyIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
