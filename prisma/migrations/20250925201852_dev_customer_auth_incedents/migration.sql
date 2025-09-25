-- CreateEnum
CREATE TYPE "EndCustomerCommentAuthorType" AS ENUM ('CUSTOMER', 'USER');

-- CreateTable
CREATE TABLE "end_customers" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "contactEmail" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "passwordHash" TEXT,
    "companyUserId" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "end_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "end_customer_incidents" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "customerId" TEXT NOT NULL,
    "companyUserId" TEXT NOT NULL,
    "businessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "slaTargetResponse" TIMESTAMP(3),
    "slaTargetResolve" TIMESTAMP(3),

    CONSTRAINT "end_customer_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "end_customer_incident_comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "authorType" "EndCustomerCommentAuthorType" NOT NULL,
    "authorId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "end_customer_incident_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "end_customer_incident_attachments" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "end_customer_incident_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EndCustomerToEndCustomerIncidentComment" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EndCustomerToEndCustomerIncidentComment_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "end_customers_contactEmail_key" ON "end_customers"("contactEmail");

-- CreateIndex
CREATE UNIQUE INDEX "end_customers_tenantId_key" ON "end_customers"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "end_customer_incidents_ticketNumber_key" ON "end_customer_incidents"("ticketNumber");

-- CreateIndex
CREATE INDEX "_EndCustomerToEndCustomerIncidentComment_B_index" ON "_EndCustomerToEndCustomerIncidentComment"("B");

-- AddForeignKey
ALTER TABLE "end_customers" ADD CONSTRAINT "end_customers_companyUserId_fkey" FOREIGN KEY ("companyUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "end_customer_incidents" ADD CONSTRAINT "end_customer_incidents_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "end_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "end_customer_incidents" ADD CONSTRAINT "end_customer_incidents_companyUserId_fkey" FOREIGN KEY ("companyUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "end_customer_incidents" ADD CONSTRAINT "end_customer_incidents_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "end_customer_incident_comments" ADD CONSTRAINT "end_customer_incident_comments_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "end_customer_incidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "end_customer_incident_attachments" ADD CONSTRAINT "end_customer_incident_attachments_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "end_customer_incidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EndCustomerToEndCustomerIncidentComment" ADD CONSTRAINT "_EndCustomerToEndCustomerIncidentComment_A_fkey" FOREIGN KEY ("A") REFERENCES "end_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EndCustomerToEndCustomerIncidentComment" ADD CONSTRAINT "_EndCustomerToEndCustomerIncidentComment_B_fkey" FOREIGN KEY ("B") REFERENCES "end_customer_incident_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
