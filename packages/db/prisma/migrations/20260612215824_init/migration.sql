/*
  Warnings:

  - Added the required column `normalizedPrice` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Order_marketId_outcome_side_status_price_createdAt_idx";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "normalizedPrice" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Order_marketId_side_status_price_createdAt_idx" ON "Order"("marketId", "side", "status", "price", "createdAt");
