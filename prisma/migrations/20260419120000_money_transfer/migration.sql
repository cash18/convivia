-- CreateTable
CREATE TABLE "MoneyTransfer" (
    "id" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "note" TEXT,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoneyTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MoneyTransfer_houseId_idx" ON "MoneyTransfer"("houseId");

-- AddForeignKey
ALTER TABLE "MoneyTransfer" ADD CONSTRAINT "MoneyTransfer_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MoneyTransfer" ADD CONSTRAINT "MoneyTransfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MoneyTransfer" ADD CONSTRAINT "MoneyTransfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MoneyTransfer" ADD CONSTRAINT "MoneyTransfer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
