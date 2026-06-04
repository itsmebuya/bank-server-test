-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('income', 'expenses');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "type" "TransactionType" NOT NULL DEFAULT 'expenses';
