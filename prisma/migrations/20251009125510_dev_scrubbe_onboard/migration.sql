-- CreateTable
CREATE TABLE "_EndCustomerToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EndCustomerToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EndCustomerToUser_B_index" ON "_EndCustomerToUser"("B");

-- AddForeignKey
ALTER TABLE "_EndCustomerToUser" ADD CONSTRAINT "_EndCustomerToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "end_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EndCustomerToUser" ADD CONSTRAINT "_EndCustomerToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
