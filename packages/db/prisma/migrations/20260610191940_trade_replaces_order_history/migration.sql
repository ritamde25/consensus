/*
  Warnings:

  - You are about to drop the `OrderHistory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `orderType` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderHistory" DROP CONSTRAINT "OrderHistory_marketId_fkey";

-- DropForeignKey
ALTER TABLE "OrderHistory" DROP CONSTRAINT "OrderHistory_userId_fkey";

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "orderType" "OrderType" NOT NULL,
ALTER COLUMN "sellerId" DROP NOT NULL,
ALTER COLUMN "positionType" DROP NOT NULL;

-- DropTable
DROP TABLE "OrderHistory";

-- CreateIndex
CREATE INDEX "OpenOrder_userId_idx" ON "OpenOrder"("userId");

-- CreateIndex
CREATE INDEX "Trade_marketId_idx" ON "Trade"("marketId");

-- CreateIndex
CREATE INDEX "Trade_buyerId_idx" ON "Trade"("buyerId");

-- CreateIndex
CREATE INDEX "Trade_sellerId_idx" ON "Trade"("sellerId");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
