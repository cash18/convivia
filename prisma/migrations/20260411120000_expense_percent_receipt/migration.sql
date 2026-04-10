-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "splitMode" TEXT NOT NULL DEFAULT 'EQUAL';
ALTER TABLE "Expense" ADD COLUMN "receiptUrl" TEXT;

-- AlterTable
ALTER TABLE "ExpenseSplit" ADD COLUMN "sharePercent" INTEGER;
